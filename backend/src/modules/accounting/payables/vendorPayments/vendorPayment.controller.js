import prisma from '../../../../config/db.js'
import { logAudit } from '../../../../utils/auditHelper.js'

const include = {
  vendors: { select: { id: true, name: true, vendor_code: true } },
  currencies: { select: { id: true, code: true, symbol: true } },
  payment_methods: { select: { id: true, name: true, code: true, gl_account_id: true, allow_multiple_accounts: true, chart_of_accounts: { select: { id: true, code: true, name: true } } } },
  journals: { select: { id: true, name: true, code: true } },
  bank_accounts: { select: { id: true, account_name: true, account_number: true } },
  payment_allocations: { include: { vendor_bills: { select: { id: true, bill_number: true, bill_date: true, amount_total: true, amount_due: true } } } },
  vendor_advances: true,
}
const id = (value) => { const parsed = Number(value); return Number.isInteger(parsed) && parsed > 0 ? parsed : null }
const date = (value) => { const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? null : parsed }
const inputError = (message) => Object.assign(new Error(message), { status: 400 })
const fail = (res, error, fallback) => {
  console.error(fallback, error)
  return res.status(error.status || (error.code === 'P2025' ? 404 : 500)).json({ success: false, message: error.message || fallback })
}
async function ensureVendorAdvanceAccount(db, companyId) {
  const existing = await db.chart_of_accounts.findFirst({ where: { company_id: companyId, is_active: true, OR: [{ code: '1400' }, { code: 'VA1400' }, { name: 'Vendor Advances' }] } })
  if (existing) return existing
  const assetType = await db.account_types.findFirst({ where: { internal_group: 'asset' }, orderBy: { sequence: 'asc' } })
  if (!assetType) throw inputError('An asset account type is required to configure Vendor Advances')
  return db.chart_of_accounts.create({ data: { company_id: companyId, code: '1400', name: 'Vendor Advances', account_type_id: assetType.id, is_reconcilable: true, allow_manual_entry: false, is_active: true } })
}
async function resolvePaymentAccount({ vendor, method, bankAccountId, currencyId }) {
  let bank = null
  if (method.allow_multiple_accounts && !bankAccountId) {
    const activeBanks = await prisma.bank_accounts.findMany({
      where: { company_id: vendor.company_id, currency_id, is_active: true, gl_account_id: { not: null }, journal_id: { not: null } },
      orderBy: [{ institution_name: 'asc' }, { account_name: 'asc' }, { id: 'asc' }],
    })
    if (activeBanks.length !== 1) throw inputError('Select a bank account for this payment method')
    bank = activeBanks[0]
  }
  if (bankAccountId) {
    bank = await prisma.bank_accounts.findUnique({ where: { id: bankAccountId } })
    if (!bank?.is_active || bank.company_id !== vendor.company_id || !bank.journal_id || !bank.gl_account_id) throw inputError('Select an active vendor-company bank account with a journal and GL account')
  }
  const accountId = method.allow_multiple_accounts ? bank?.gl_account_id : method.gl_account_id || bank?.gl_account_id
  if (!accountId) throw inputError('Link this payment method to a GL account before using it')
  const account = await prisma.chart_of_accounts.findFirst({
    where: {
      id: accountId, company_id: vendor.company_id, is_active: true, allow_manual_entry: true,
      account_types: { internal_group: 'asset' }, other_chart_of_accounts: { none: {} },
      ...(currencyId ? { OR: [{ currency_id: null }, { currency_id: currencyId }] } : {}),
    },
  })
  if (!account) throw inputError('The selected payment method GL account is inactive, a parent, or incompatible')
  const journal = bank?.journal_id
    ? await prisma.journals.findUnique({ where: { id: bank.journal_id } })
    : await prisma.journals.findFirst({
      where: {
        company_id: vendor.company_id, is_active: true, journal_type: 'bank',
        OR: [{ default_debit_account_id: account.id }, { default_credit_account_id: account.id }, { default_debit_account_id: null }],
      },
      orderBy: [{ default_debit_account_id: 'desc' }, { code: 'asc' }, { id: 'asc' }],
    }) || await prisma.journals.findFirst({
      where: { company_id: vendor.company_id, is_active: true, journal_type: 'bank' },
      orderBy: [{ code: 'asc' }, { id: 'asc' }],
    })
  if (!journal?.is_active || journal.company_id !== vendor.company_id) throw inputError('Configure an active payment journal for this company')
  if (bank && journal.id !== bank.journal_id) throw inputError('The selected bank account journal is inactive or invalid')
  return { bank, journal, account }
}
async function prepare(input) {
  const vendorId = id(input.vendor_id)
  const paymentDate = date(input.payment_date)
  const paymentMethodId = id(input.payment_method_id)
  const bankAccountId = id(input.bank_account_id)
  const amount = Number(input.amount)
  if (!vendorId || !paymentDate || !paymentMethodId) throw inputError('Vendor, date, and payment method are required')
  if (!Number.isFinite(amount) || amount <= 0) throw inputError('Payment amount must be greater than zero')
  const [vendor, method] = await Promise.all([
    prisma.vendors.findUnique({ where: { id: vendorId }, include: { companies: true } }),
    prisma.payment_methods.findUnique({ where: { id: paymentMethodId } }),
  ])
  if (!vendor?.is_active) throw inputError('Active vendor not found')
  if (!vendor.companies?.is_active) throw inputError('Vendor company is inactive or missing')
  if (!method?.is_active || !['outbound', 'both'].includes(method.payment_type)) throw inputError('Select an active outbound payment method')
  const fiscalPeriod = await prisma.fiscal_periods.findFirst({ where: { state: 'open', fiscal_years: { company_id: vendor.company_id, state: 'open' }, start_date: { lte: paymentDate }, end_date: { gte: paymentDate } } })
  if (!fiscalPeriod) throw inputError('No open fiscal period covers the payment date')
  const currencyId = id(input.currency_id) || vendor.currency_id || vendor.companies.currency_id
  const { bank, journal, account } = await resolvePaymentAccount({ vendor, method, bankAccountId, currencyId })
  if (bank && currencyId !== bank.currency_id) throw inputError('Payment currency must match the selected bank account')
  const exchangeRate = Number(input.exchange_rate || 1)
  if (!Number.isFinite(exchangeRate) || exchangeRate <= 0) throw inputError('A positive exchange rate is required')
  const allocations = (Array.isArray(input.allocations) ? input.allocations : []).map((row) => ({ bill_id: id(row.bill_id), allocated_amount: Math.round(Number(row.allocated_amount) * 100) / 100 }))
  if (allocations.some((row) => !row.bill_id || !Number.isFinite(row.allocated_amount) || row.allocated_amount <= 0)) throw inputError('Every allocation needs a bill and a positive amount')
  if (new Set(allocations.map((row) => row.bill_id)).size !== allocations.length) throw inputError('A bill can only be allocated once')
  const bills = allocations.length ? await prisma.vendor_bills.findMany({ where: { id: { in: allocations.map((row) => row.bill_id) } } }) : []
  for (const allocation of allocations) {
    const bill = bills.find((row) => row.id === allocation.bill_id)
    if (!bill || bill.vendor_id !== vendorId || bill.document_type !== 'bill' || bill.state !== 'posted' || bill.currency_id !== currencyId) throw inputError('Allocation contains an invalid vendor bill')
    if (allocation.allocated_amount > Number(bill.amount_due) + 0.005) throw inputError(`Allocation exceeds the balance of ${bill.bill_number}`)
  }
  const allocated = allocations.reduce((sum, row) => sum + row.allocated_amount, 0)
  if (allocated > amount + 0.005) throw inputError('Allocated amount cannot exceed payment amount')
  const payableAccount = await prisma.chart_of_accounts.findFirst({ where: { company_id: vendor.company_id, code: '2000', is_active: true } })
  if (!payableAccount) throw inputError('Accounts Payable account 2000 was not found')
  const advanceAccount = amount - allocated > 0.005 ? await ensureVendorAdvanceAccount(prisma, vendor.company_id) : null
  return {
    header: { company_id: vendor.company_id, vendor_id: vendorId, journal_id: journal.id, payment_method_id: paymentMethodId, bank_account_id: bank?.id || null, fiscal_period_id: fiscalPeriod.id, payment_date: paymentDate, currency_id: currencyId, exchange_rate: exchangeRate, amount, unallocated_amount: Math.round((amount - allocated) * 100) / 100, reference: String(input.reference || '').trim() || null, memo: String(input.memo || '').trim() || null, state: 'draft' },
    allocations,
    payableAccountId: payableAccount.id,
    advanceAccountId: advanceAccount?.id || null,
    allocatedAmount: allocated,
    paymentAccountId: account.id,
  }
}

function paymentEntryData(prepared, paymentNumber, paymentId, state = 'draft', postedAt = null) {
  const baseAmount = Math.round(Number(prepared.header.amount) * Number(prepared.header.exchange_rate) * 100) / 100
  const allocatedBase = Math.round(Number(prepared.allocatedAmount) * Number(prepared.header.exchange_rate) * 100) / 100
  const advanceBase = Math.round((baseAmount - allocatedBase) * 100) / 100
  const debitLines = [
    ...(allocatedBase > 0 ? [{ sequence: 10, account_id: prepared.payableAccountId, label: 'Accounts Payable', partner_type: 'vendor', partner_id: prepared.header.vendor_id, debit: allocatedBase, credit: 0, currency_id: prepared.header.currency_id, amount_currency: Number(prepared.allocatedAmount) }] : []),
    ...(advanceBase > 0 ? [{ sequence: 20, account_id: prepared.advanceAccountId, label: 'Vendor Advance', partner_type: 'vendor', partner_id: prepared.header.vendor_id, debit: advanceBase, credit: 0, currency_id: prepared.header.currency_id, amount_currency: Number(prepared.header.amount) - Number(prepared.allocatedAmount) }] : []),
  ]
  return {
    company_id: prepared.header.company_id,
    journal_id: prepared.header.journal_id,
    entry_number: paymentNumber,
    entry_date: prepared.header.payment_date,
    fiscal_period_id: prepared.header.fiscal_period_id,
    reference: prepared.header.reference || paymentNumber,
    narration: prepared.header.memo || `${state === 'posted' ? 'Posted' : 'Draft'} vendor payment ${paymentNumber}`,
    state,
    source_type: 'vendor_payment',
    source_id: paymentId,
    posted_at: postedAt,
    journal_items: { create: [...debitLines, { sequence: 30, account_id: prepared.paymentAccountId, label: 'Payment method clearing', partner_type: 'vendor', partner_id: prepared.header.vendor_id, debit: 0, credit: baseAmount, currency_id: prepared.header.currency_id, amount_currency: -Number(prepared.header.amount) }] },
  }
}
async function number(tx, journalId) {
  const journal = await tx.journals.update({ where: { id: journalId }, data: { next_sequence: { increment: 1 } }, select: { next_sequence: true } })
  return `PAY${String(journal.next_sequence - 1).padStart(4, '0')}`
}
export const getAll = async (_req, res) => {
  try { res.json({ success: true, data: await prisma.vendor_payments.findMany({ include, orderBy: { created_at: 'desc' } }) }) }
  catch (error) { fail(res, error, 'Failed to fetch vendor payments') }
}
export const getById = async (req, res) => {
  const paymentId = id(req.params.id)
  if (!paymentId) return res.status(400).json({ success: false, message: 'Invalid payment id' })
  try {
    const data = await prisma.vendor_payments.findUnique({ where: { id: paymentId }, include })
    if (!data) return res.status(404).json({ success: false, message: 'Vendor payment not found' })
    res.json({ success: true, data })
  } catch (error) { fail(res, error, 'Failed to fetch vendor payment') }
}
export const getAdvances = async (req, res) => {
  const vendorId = id(req.query.vendor_id)
  const currencyId = id(req.query.currency_id)
  if (!vendorId) return res.status(400).json({ success: false, message: 'Vendor is required' })
  try {
    const data = await prisma.vendor_advances.findMany({
      where: { vendor_id: vendorId, ...(currencyId ? { currency_id: currencyId } : {}), state: { in: ['open', 'partial'] }, remaining_amount: { gt: 0 } },
      include: { vendor_payments: { select: { payment_number: true, payment_date: true } }, applications: { include: { vendor_bills: { select: { bill_number: true } } } } },
      orderBy: { created_at: 'asc' },
    })
    const balance = data.reduce((sum, row) => sum + Number(row.remaining_amount), 0)
    res.json({ success: true, data, summary: { advance_balance: Math.round(balance * 100) / 100 } })
  } catch (error) { fail(res, error, 'Failed to fetch vendor advances') }
}
export const create = async (req, res) => {
  try {
    const prepared = await prepare(req.body)
    const data = await prisma.$transaction(async (tx) => {
      const paymentNumber = await number(tx, prepared.header.journal_id)
      const payment = await tx.vendor_payments.create({ data: { ...prepared.header, payment_number: paymentNumber, payment_allocations: { create: prepared.allocations } } })
      const entry = await tx.journal_entries.create({ data: paymentEntryData(prepared, paymentNumber, payment.id) })
      return tx.vendor_payments.update({ where: { id: payment.id }, data: { journal_entry_id: entry.id }, include })
    }, { maxWait: 10000, timeout: 30000 })
    await logAudit({ userId: req.user?.id, action: 'Created', entity: 'VendorPayment', entityId: data.id, description: `Created draft vendor payment "${data.payment_number}"` })
    res.status(201).json({ success: true, message: 'Draft vendor payment created successfully', data })
  } catch (error) { fail(res, error, 'Failed to create vendor payment') }
}
export const update = async (req, res) => {
  const paymentId = id(req.params.id)
  if (!paymentId) return res.status(400).json({ success: false, message: 'Invalid payment id' })
  try {
    const existing = await prisma.vendor_payments.findUnique({ where: { id: paymentId } })
    if (!existing || existing.state !== 'draft') throw inputError('Draft vendor payment not found')
    const prepared = await prepare(req.body)
    const data = await prisma.$transaction(async (tx) => {
      await tx.payment_allocations.deleteMany({ where: { payment_id: paymentId } })
      await tx.vendor_payments.update({ where: { id: paymentId }, data: { ...prepared.header, payment_number: existing.payment_number, payment_allocations: { create: prepared.allocations }, updated_at: new Date() } })
      if (existing.journal_entry_id) {
        await tx.journal_items.deleteMany({ where: { entry_id: existing.journal_entry_id } })
        await tx.journal_entries.update({ where: { id: existing.journal_entry_id }, data: { ...paymentEntryData(prepared, existing.payment_number, paymentId), journal_items: { create: paymentEntryData(prepared, existing.payment_number, paymentId).journal_items.create } } })
      } else {
        const entry = await tx.journal_entries.create({ data: paymentEntryData(prepared, existing.payment_number, paymentId) })
        await tx.vendor_payments.update({ where: { id: paymentId }, data: { journal_entry_id: entry.id } })
      }
      return tx.vendor_payments.findUnique({ where: { id: paymentId }, include })
    }, { maxWait: 10000, timeout: 30000 })
    res.json({ success: true, message: 'Draft vendor payment updated successfully', data })
  } catch (error) { fail(res, error, 'Failed to update vendor payment') }
}
export const remove = async (req, res) => {
  const paymentId = id(req.params.id)
  if (!paymentId) return res.status(400).json({ success: false, message: 'Invalid payment id' })
  try {
    const existing = await prisma.vendor_payments.findUnique({ where: { id: paymentId } })
    if (!existing || existing.state !== 'draft') throw inputError('Draft vendor payment not found')
    await prisma.$transaction(async (tx) => {
      await tx.vendor_payments.delete({ where: { id: paymentId } })
      if (existing.journal_entry_id) await tx.journal_entries.deleteMany({ where: { id: existing.journal_entry_id, state: 'draft', source_type: 'vendor_payment' } })
    })
    res.json({ success: true, message: 'Draft vendor payment deleted successfully' })
  } catch (error) { fail(res, error, 'Failed to delete vendor payment') }
}
export const post = async (req, res) => {
  const paymentId = id(req.params.id)
  if (!paymentId) return res.status(400).json({ success: false, message: 'Invalid payment id' })
  try {
    const data = await prisma.$transaction(async (tx) => {
      const payment = await tx.vendor_payments.findUnique({ where: { id: paymentId }, include: { payment_allocations: true, payment_methods: true } })
      if (!payment || payment.state !== 'draft') throw inputError('Draft vendor payment not found')
      if (!payment.fiscal_period_id) throw inputError('Vendor payment is missing its fiscal period')
      const allocated = payment.payment_allocations.reduce((sum, allocation) => sum + Number(allocation.allocated_amount), 0)
      if (allocated > Number(payment.amount) + 0.005) throw inputError('Allocated amount cannot exceed payment amount')
      const advanceAmount = Math.max(0, Math.round((Number(payment.amount) - allocated) * 100) / 100)
      const [vendor, bank, journal, payableAccount] = await Promise.all([
        tx.vendors.findUnique({ where: { id: payment.vendor_id }, include: { companies: true } }),
        payment.bank_account_id ? tx.bank_accounts.findUnique({ where: { id: payment.bank_account_id } }) : Promise.resolve(null),
        tx.journals.findUnique({ where: { id: payment.journal_id } }),
        tx.chart_of_accounts.findFirst({
          where: {
            company_id: payment.company_id,
            is_active: true,
            code: '2000',
          },
          orderBy: { code: 'asc' },
        }),
      ])
      if (!vendor?.is_active) throw inputError('Active vendor not found')
      if (payment.payment_methods?.allow_multiple_accounts && !bank) throw inputError('Vendor payment is missing the selected bank account')
      const paymentAccountId = payment.payment_methods?.allow_multiple_accounts ? bank?.gl_account_id : payment.payment_methods?.gl_account_id || bank?.gl_account_id
      if (!payment.payment_methods?.is_active || !['outbound', 'both'].includes(payment.payment_methods.payment_type)) throw inputError('Payment method is inactive or incompatible')
      if (!paymentAccountId) throw inputError('Link this payment method to a GL account before posting')
      const paymentAccount = await tx.chart_of_accounts.findFirst({
        where: {
          id: paymentAccountId, company_id: payment.company_id, is_active: true, allow_manual_entry: true,
          account_types: { internal_group: 'asset' }, other_chart_of_accounts: { none: {} },
        },
        include: { account_types: true, other_chart_of_accounts: { select: { id: true } } },
      })
      if (!paymentAccount) throw inputError('The selected payment method GL account is inactive, a parent, or incompatible')
      if (bank && (!bank.is_active || bank.company_id !== payment.company_id || bank.gl_account_id !== paymentAccountId)) throw inputError('The selected bank account is inactive or inconsistent with the payment method')
      if (!journal?.is_active || journal.company_id !== payment.company_id || (bank && journal.id !== bank.journal_id)) throw inputError('The selected payment journal is inactive or invalid')
      if (!payableAccount) throw inputError('Accounts Payable account 2000 was not found')
      const advanceAccount = advanceAmount > 0 ? await ensureVendorAdvanceAccount(tx, payment.company_id) : null
      const fiscalPeriod = await tx.fiscal_periods.findUnique({ where: { id: payment.fiscal_period_id } })
      if (!fiscalPeriod || fiscalPeriod.state !== 'open') throw inputError('Payment fiscal period is closed or invalid')
      const existingEntry = await tx.journal_entries.findFirst({ where: { source_type: 'vendor_payment', source_id: paymentId }, select: { id: true, state: true } })
      if (existingEntry && existingEntry.state !== 'draft') throw inputError('Linked vendor payment journal entry is invalid')
      for (const allocation of payment.payment_allocations) {
        const bill = await tx.vendor_bills.findUnique({ where: { id: allocation.bill_id } })
        if (!bill || bill.state !== 'posted' || bill.vendor_id !== payment.vendor_id) throw inputError('An allocated bill is no longer available')
        if (bill.currency_id !== payment.currency_id) throw inputError('An allocated bill has a different currency')
        if (Number(allocation.allocated_amount) > Number(bill.amount_due) + 0.005) throw inputError(`Allocation exceeds the balance of ${bill.bill_number}`)
        const due = Math.max(0, Number(bill.amount_due) - Number(allocation.allocated_amount))
        await tx.vendor_bills.update({ where: { id: bill.id }, data: { amount_due: due, payment_state: due <= 0.005 ? 'paid' : 'partial', updated_at: new Date() } })
      }
      const postedAt = new Date()
      const entry = existingEntry
        ? await tx.journal_entries.update({ where: { id: existingEntry.id }, data: { state: 'posted', posted_at: postedAt, narration: payment.memo || `Vendor payment ${payment.payment_number}` } })
        : await tx.journal_entries.create({ data: {
          company_id: payment.company_id, journal_id: payment.journal_id, entry_number: payment.payment_number,
          entry_date: payment.payment_date, fiscal_period_id: payment.fiscal_period_id,
          reference: payment.reference || payment.payment_number, narration: payment.memo || `Vendor payment ${payment.payment_number}`,
          state: 'posted', source_type: 'vendor_payment', source_id: payment.id, posted_at: postedAt,
          journal_items: { create: [
            ...(allocated > 0 ? [{ sequence: 10, account_id: payableAccount.id, label: 'Accounts Payable', partner_type: 'vendor', partner_id: payment.vendor_id, debit: Math.round(allocated * Number(payment.exchange_rate) * 100) / 100, credit: 0, currency_id: payment.currency_id, amount_currency: allocated }] : []),
            ...(advanceAmount > 0 ? [{ sequence: 20, account_id: advanceAccount.id, label: 'Vendor Advance', partner_type: 'vendor', partner_id: payment.vendor_id, debit: Math.round(advanceAmount * Number(payment.exchange_rate) * 100) / 100, credit: 0, currency_id: payment.currency_id, amount_currency: advanceAmount }] : []),
            { sequence: 30, account_id: paymentAccountId, label: 'Payment method clearing', partner_type: 'vendor', partner_id: payment.vendor_id, debit: 0, credit: Math.round(Number(payment.amount) * Number(payment.exchange_rate) * 100) / 100, currency_id: payment.currency_id, amount_currency: -Number(payment.amount) },
          ] },
        } })
      if (advanceAmount > 0) await tx.vendor_advances.create({ data: { company_id: payment.company_id, vendor_id: payment.vendor_id, currency_id: payment.currency_id, payment_id: payment.id, advance_account_id: advanceAccount.id, original_amount: advanceAmount, remaining_amount: advanceAmount, state: 'open' } })
      await tx.vendor_payments.update({ where: { id: paymentId }, data: { state: 'posted', journal_entry_id: entry.id, posted_at: postedAt, updated_at: postedAt } })
      return tx.vendor_payments.findUnique({ where: { id: paymentId }, include })
    }, { maxWait: 10000, timeout: 30000 })
    await logAudit({ userId: req.user?.id, action: 'Posted', entity: 'VendorPayment', entityId: paymentId, description: `Posted vendor payment "${data.payment_number}"` })
    res.json({ success: true, message: 'Vendor payment posted successfully', data })
  } catch (error) { fail(res, error, 'Failed to post vendor payment') }
}
