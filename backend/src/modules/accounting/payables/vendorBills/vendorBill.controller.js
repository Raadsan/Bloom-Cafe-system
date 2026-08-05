import prisma from '../../../../config/db.js'
import { logAudit } from '../../../../utils/auditHelper.js'
const include = {
  vendors: { select: { id: true, name: true, phone: true, email: true, vendor_code: true, company_id: true } },
  currencies: { select: { id: true, code: true, symbol: true } },
  payment_terms: { select: { id: true, name: true } },
  fiscal_periods: { select: { id: true, name: true, start_date: true, end_date: true, state: true } },
  journal_entries: { select: { id: true, entry_number: true, state: true } },
  vendor_bill_lines: {
    orderBy: { sequence: 'asc' },
    include: {
      products: { select: { id: true, name: true, sku: true } },
      taxes: { select: { id: true, name: true, rate_percent: true, price_includes_tax: true } },
      chart_of_accounts: { select: { id: true, code: true, name: true } },
    },
  },
}

const parseId = (value) => {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}
const parseDate = (value) => {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}
const inputError = (message) => Object.assign(new Error(message), { status: 400 })
const fail = (res, error, fallback) => {
  console.error(fallback, error)
  return res.status(error.status || (error.code === 'P2025' ? 404 : 500))
    .json({ success: false, message: error.message || fallback })
}

// Vendor bills affect the P&L only through posted journal entries.  Keep the
// entry alongside the bill so a bill can be reviewed as a draft before it is
// posted, just like customer invoices.
function journalItems(prepared) {
  const rate = Number(prepared.header.exchange_rate)
  const debits = new Map()
  for (const line of prepared.lines) {
    debits.set(line.expense_account_id, (debits.get(line.expense_account_id) || 0) + Number(line.subtotal))
  }
  // A purchase tax is included in the expense unless a separate input-tax
  // account is configured. This guarantees a balanced entry for every bill.
  if (Number(prepared.header.amount_tax) > 0) {
    const firstExpenseAccount = prepared.lines[0]?.expense_account_id
    debits.set(firstExpenseAccount, (debits.get(firstExpenseAccount) || 0) + Number(prepared.header.amount_tax))
  }
  const items = [...debits.entries()].map(([accountId, amount], index) => ({
    sequence: (index + 1) * 10,
    account_id: accountId,
    label: 'Vendor bill expense',
    partner_type: 'vendor',
    partner_id: prepared.header.vendor_id,
    debit: Math.round(amount * rate * 100) / 100,
    credit: 0,
    currency_id: prepared.header.currency_id,
    amount_currency: amount,
  }))
  const debit = items.reduce((sum, item) => sum + Number(item.debit), 0)
  items.push({
    sequence: (items.length + 1) * 10,
    account_id: prepared.header.payable_account_id,
    label: 'Accounts Payable',
    partner_type: 'vendor',
    partner_id: prepared.header.vendor_id,
    debit: 0,
    credit: debit,
    currency_id: prepared.header.currency_id,
    amount_currency: -Number(prepared.header.amount_total),
  })
  return items
}

function entryData(prepared, billNumber, billId, state = 'draft', postedAt = null) {
  return {
    company_id: prepared.header.company_id,
    journal_id: prepared.header.journal_id,
    entry_number: billNumber,
    entry_date: prepared.header.bill_date,
    fiscal_period_id: prepared.header.fiscal_period_id,
    reference: billNumber,
    narration: `${state === 'posted' ? 'Posted' : 'Draft'} vendor bill ${billNumber}`,
    state,
    source_type: 'vendor_bill',
    source_id: billId,
    posted_at: postedAt,
    journal_items: { create: journalItems(prepared) },
  }
}

async function prepareBill(input, documentType = 'bill') {
  const vendorId = parseId(input.vendor_id)
  const billDate = parseDate(input.bill_date)
  const lines = Array.isArray(input.lines) ? input.lines : []
  if (!vendorId || !billDate) throw inputError('Vendor and bill date are required')
  if (!lines.length) throw inputError('Add at least one bill line')
  const reversedBillId = documentType === 'refund' ? parseId(input.reversed_bill_id) : null

  const vendor = await prisma.vendors.findUnique({ where: { id: vendorId } })
  if (!vendor || !vendor.is_active) throw inputError('Active vendor not found')
  const [company, journal, paymentTerm, fiscalPeriod] = await Promise.all([
    prisma.companies.findUnique({ where: { id: vendor.company_id } }),
    prisma.journals.findFirst({ where: { company_id: vendor.company_id, code: 'BILL', is_active: true } }),
    parseId(input.payment_term_id) ? prisma.payment_terms.findUnique({ where: { id: parseId(input.payment_term_id) }, include: { payment_term_lines: true } }) : null,
    prisma.fiscal_periods.findFirst({
      where: { state: 'open', fiscal_years: { company_id: vendor.company_id, state: 'open' }, start_date: { lte: billDate }, end_date: { gte: billDate } },
      orderBy: { period_number: 'asc' },
    }),
  ])
  if (!company?.is_active) throw inputError('Vendor company is inactive or missing')
  if (!journal || journal.journal_type !== 'purchase') throw inputError('Active Vendor Bills journal (BILL) was not found')
  if (!fiscalPeriod) throw inputError('No open fiscal period covers the bill date')

  const currencyId = parseId(input.currency_id) || company.currency_id
  const [currency, payableAccount, expenseAccount] = await Promise.all([
    prisma.currencies.findUnique({ where: { id: currencyId } }),
    prisma.chart_of_accounts.findFirst({
      where: {
        company_id: vendor.company_id, code: '2000', is_active: true,
        allow_manual_entry: true, account_types: { internal_group: 'liability' },
        other_chart_of_accounts: { none: {} },
      },
      orderBy: { code: 'asc' },
    }),
    prisma.chart_of_accounts.findFirst({
      where: {
        company_id: vendor.company_id, code: '5005', is_active: true,
        allow_manual_entry: true, account_types: { internal_group: 'expense' },
        other_chart_of_accounts: { none: {} },
      },
    }),
  ])
  if (!currency?.is_active) throw inputError('Bill currency is inactive or missing')
  if (!payableAccount) throw inputError('Accounts Payable account 2000 was not found')
  if (!expenseAccount) throw inputError('Default purchase expense account 5005 – Cafeteria Expense was not found or is not a posting account')
  if (reversedBillId) {
    const original = await prisma.vendor_bills.findFirst({ where: { id: reversedBillId, document_type: 'bill', vendor_id: vendorId, state: 'posted' } })
    if (!original) throw inputError('Original posted vendor bill was not found for this vendor')
  }

  const productIds = [...new Set(lines.map((line) => parseId(line.product_id)).filter(Boolean))]
  const taxIds = [...new Set(lines.map((line) => parseId(line.tax_id)).filter(Boolean))]
  const [products, taxes] = await Promise.all([
    prisma.products.findMany({ where: { id: { in: productIds } } }),
    prisma.taxes.findMany({ where: { id: { in: taxIds } } }),
  ])
  const productMap = new Map(products.map((row) => [row.id, row]))
  const taxMap = new Map(taxes.map((row) => [row.id, row]))
  let amountUntaxed = 0
  let amountTax = 0
  const preparedLines = lines.map((line, index) => {
    const productId = parseId(line.product_id)
    const product = productId ? productMap.get(productId) : null
    const taxId = parseId(line.tax_id)
    const tax = taxId ? taxMap.get(taxId) : null
    const quantity = Number(line.quantity)
    const unitPrice = Number(line.unit_price)
    const discount = Number(line.discount_percent || 0)
    const description = String(line.description || product?.name || '').trim()
    if (productId && (!product || !product.is_active || !product.can_be_purchased)) throw inputError(`Line ${index + 1}: product is not active and purchasable`)
    if (!description) throw inputError(`Line ${index + 1}: description is required`)
    if (!Number.isFinite(quantity) || quantity <= 0) throw inputError(`Line ${index + 1}: quantity must be greater than zero`)
    if (!Number.isFinite(unitPrice) || unitPrice < 0) throw inputError(`Line ${index + 1}: unit price cannot be negative`)
    if (!Number.isFinite(discount) || discount < 0 || discount > 100) throw inputError(`Line ${index + 1}: discount must be between 0 and 100`)
    if (taxId && !tax) throw inputError(`Line ${index + 1}: tax not found`)
    const discounted = quantity * unitPrice * (1 - discount / 100)
    const rate = tax ? Number(tax.rate_percent) / 100 : 0
    const untaxed = tax?.price_includes_tax && rate ? discounted / (1 + rate) : discounted
    const taxAmount = tax ? (tax.price_includes_tax ? discounted - untaxed : untaxed * rate) : 0
    amountUntaxed += Math.round(untaxed * 100) / 100
    amountTax += Math.round(taxAmount * 100) / 100
    return { sequence: (index + 1) * 10, product_id: productId, description, quantity, unit_price: unitPrice, discount_percent: discount, tax_id: taxId, expense_account_id: expenseAccount.id, subtotal: Math.round(untaxed * 100) / 100 }
  })
  amountUntaxed = Math.round(amountUntaxed * 100) / 100
  amountTax = Math.round(amountTax * 100) / 100
  const amountTotal = Math.round((amountUntaxed + amountTax) * 100) / 100
  const dueDays = paymentTerm?.payment_term_lines?.length ? Math.max(...paymentTerm.payment_term_lines.map((line) => Number(line.due_days || 0))) : 0
  const dueDate = new Date(billDate)
  dueDate.setUTCDate(dueDate.getUTCDate() + dueDays)
  const exchangeRate = currencyId === company.currency_id ? 1 : Number(input.exchange_rate)
  if (!Number.isFinite(exchangeRate) || exchangeRate <= 0) throw inputError('A positive exchange rate is required')
  return {
    header: {
      company_id: vendor.company_id, document_type: documentType, vendor_id: vendorId,
      vendor_reference: String(input.vendor_reference || '').trim() || null, journal_id: journal.id,
      fiscal_period_id: fiscalPeriod.id, bill_date: billDate, received_date: parseDate(input.received_date) || billDate,
      due_date: dueDate, payment_term_id: paymentTerm?.id || null, currency_id: currencyId,
      exchange_rate: exchangeRate, payable_account_id: payableAccount.id, reversed_bill_id: reversedBillId, state: 'draft',
      payment_state: 'not_paid', amount_untaxed: amountUntaxed, amount_tax: amountTax,
      amount_total: amountTotal, amount_paid: 0, amount_due: amountTotal, notes: String(input.notes || '').trim() || null,
    },
    lines: preparedLines,
  }
}

async function allocateNumber(tx, journal, prefix = journal.code) {
  for (;;) {
    const updated = await tx.journals.update({ where: { id: journal.id }, data: { next_sequence: { increment: 1 } }, select: { next_sequence: true } })
    const number = `${prefix}${String(updated.next_sequence - 1).padStart(4, '0')}`
    const exists = await tx.vendor_bills.findFirst({ where: { company_id: journal.company_id, bill_number: number }, select: { id: true } })
    if (!exists) return number
  }
}

export const getAll = async (_req, res) => {
  try { res.json({ success: true, data: await prisma.vendor_bills.findMany({ where: { document_type: 'bill' }, include, orderBy: { created_at: 'desc' } }) }) }
  catch (error) { fail(res, error, 'Failed to fetch vendor bills') }
}
export const getById = async (req, res) => {
  const billId = parseId(req.params.id)
  if (!billId) return res.status(400).json({ success: false, message: 'Invalid bill id' })
  try {
    const data = await prisma.vendor_bills.findUnique({ where: { id: billId }, include })
    if (!data) return res.status(404).json({ success: false, message: 'Vendor bill not found' })
    res.json({ success: true, data })
  } catch (error) { fail(res, error, 'Failed to fetch vendor bill') }
}
export const create = async (req, res) => {
  try {
    const prepared = await prepareBill(req.body)
    const data = await prisma.$transaction(async (tx) => {
      const journal = await tx.journals.findUnique({ where: { id: prepared.header.journal_id } })
      const billNumber = await allocateNumber(tx, journal)
      const bill = await tx.vendor_bills.create({ data: { ...prepared.header, bill_number: billNumber, vendor_bill_lines: { create: prepared.lines } } })
      const entry = await tx.journal_entries.create({ data: entryData(prepared, billNumber, bill.id) })
      return tx.vendor_bills.update({ where: { id: bill.id }, data: { journal_entry_id: entry.id }, include })
    }, { maxWait: 10000, timeout: 30000 })
    await logAudit({ userId: req.user?.id, action: 'Created', entity: 'VendorBill', entityId: data.id, description: `Prepared draft vendor bill "${data.bill_number}"` })
    res.status(201).json({ success: true, message: 'Draft vendor bill prepared successfully', data })
  } catch (error) { fail(res, error, 'Failed to prepare vendor bill') }
}
export const update = async (req, res) => {
  const billId = parseId(req.params.id)
  if (!billId) return res.status(400).json({ success: false, message: 'Invalid bill id' })
  try {
    const existing = await prisma.vendor_bills.findUnique({ where: { id: billId } })
    if (!existing) return res.status(404).json({ success: false, message: 'Vendor bill not found' })
    if (existing.state !== 'draft') throw inputError('Only draft vendor bills can be edited')
    const prepared = await prepareBill(req.body)
    const data = await prisma.$transaction(async (tx) => {
      await tx.vendor_bill_lines.deleteMany({ where: { bill_id: billId } })
      const bill = await tx.vendor_bills.update({ where: { id: billId }, data: { ...prepared.header, bill_number: existing.bill_number, vendor_bill_lines: { create: prepared.lines }, updated_at: new Date() } })
      if (existing.journal_entry_id) {
        await tx.journal_items.deleteMany({ where: { entry_id: existing.journal_entry_id } })
        await tx.journal_entries.update({ where: { id: existing.journal_entry_id }, data: { ...entryData(prepared, existing.bill_number, billId), journal_items: { create: journalItems(prepared) } } })
      } else {
        const entry = await tx.journal_entries.create({ data: entryData(prepared, existing.bill_number, billId) })
        await tx.vendor_bills.update({ where: { id: billId }, data: { journal_entry_id: entry.id } })
      }
      return tx.vendor_bills.findUnique({ where: { id: bill.id }, include })
    }, { maxWait: 10000, timeout: 30000 })
    await logAudit({ userId: req.user?.id, action: 'Updated', entity: 'VendorBill', entityId: data.id, description: `Updated draft vendor bill "${data.bill_number}"` })
    res.json({ success: true, message: 'Draft vendor bill updated successfully', data })
  } catch (error) { fail(res, error, 'Failed to update vendor bill') }
}
export const remove = async (req, res) => {
  const billId = parseId(req.params.id)
  if (!billId) return res.status(400).json({ success: false, message: 'Invalid bill id' })
  try {
    const existing = await prisma.vendor_bills.findUnique({ where: { id: billId } })
    if (!existing) return res.status(404).json({ success: false, message: 'Vendor bill not found' })
    if (existing.state !== 'draft') throw inputError('Only draft vendor bills can be deleted')
    await prisma.$transaction(async (tx) => {
      await tx.vendor_bills.delete({ where: { id: billId } })
      if (existing.journal_entry_id) await tx.journal_entries.deleteMany({ where: { id: existing.journal_entry_id, state: 'draft', source_type: 'vendor_bill' } })
    })
    await logAudit({ userId: req.user?.id, action: 'Deleted', entity: 'VendorBill', entityId: billId, description: `Deleted draft vendor bill "${existing.bill_number}"` })
    res.json({ success: true, message: 'Draft vendor bill deleted successfully' })
  } catch (error) { fail(res, error, 'Failed to delete vendor bill') }
}

export const post = async (req, res) => {
  const billId = parseId(req.params.id)
  if (!billId) return res.status(400).json({ success: false, message: 'Invalid bill id' })
  try {
    const data = await prisma.$transaction(async (tx) => {
      const bill = await tx.vendor_bills.findUnique({ where: { id: billId }, include: { fiscal_periods: { include: { fiscal_years: true } }, journal_entries: true } })
      if (!bill) throw inputError('Vendor bill not found')
      if (bill.state !== 'draft') throw inputError('Only draft vendor bills can be posted')
      if (!bill.fiscal_periods || bill.fiscal_periods.state !== 'open' || bill.fiscal_periods.fiscal_years.state !== 'open') throw inputError('Bill fiscal period is closed or invalid')
      const postedAt = new Date()
      if (!bill.journal_entry_id || !bill.journal_entries || bill.journal_entries.state !== 'draft') throw inputError('Linked draft journal entry is missing or invalid')
      await tx.journal_entries.update({ where: { id: bill.journal_entry_id }, data: { state: 'posted', posted_at: postedAt, narration: `Posted vendor bill ${bill.bill_number}` } })
      const requestedAdvance = Math.max(0, Math.round(Number(req.body?.advance_amount || 0) * 100) / 100)
      const advances = requestedAdvance > 0 ? await tx.vendor_advances.findMany({ where: { vendor_id: bill.vendor_id, currency_id: bill.currency_id, state: { in: ['open', 'partial'] }, remaining_amount: { gt: 0 } }, orderBy: { created_at: 'asc' } }) : []
      const availableAdvance = advances.reduce((sum, advance) => sum + Number(advance.remaining_amount), 0)
      if (requestedAdvance > availableAdvance + 0.005) throw inputError('Requested Vendor Advance exceeds the available balance')
      let advanceRemaining = Math.min(requestedAdvance, Number(bill.amount_total))
      for (const advance of advances) {
        if (advanceRemaining <= 0.005) break
        const applied = Math.min(advanceRemaining, Number(advance.remaining_amount))
        const application = await tx.vendor_advance_applications.create({ data: { advance_id: advance.id, bill_id: bill.id, amount: applied } })
        const baseAmount = Math.round(applied * Number(bill.exchange_rate) * 100) / 100
        await tx.journal_entries.create({ data: {
          company_id: bill.company_id, journal_id: bill.journal_id, entry_number: `VA${String(application.id).padStart(6, '0')}`,
          entry_date: bill.bill_date, fiscal_period_id: bill.fiscal_period_id, reference: bill.bill_number,
          narration: `Vendor Advance applied to ${bill.bill_number}`, state: 'posted', source_type: 'vendor_advance', source_id: application.id, posted_at: postedAt,
          journal_items: { create: [
            { sequence: 10, account_id: bill.payable_account_id, label: 'Accounts Payable', partner_type: 'vendor', partner_id: bill.vendor_id, debit: baseAmount, credit: 0, currency_id: bill.currency_id, amount_currency: applied },
            { sequence: 20, account_id: advance.advance_account_id, label: 'Vendor Advance applied', partner_type: 'vendor', partner_id: bill.vendor_id, debit: 0, credit: baseAmount, currency_id: bill.currency_id, amount_currency: -applied },
          ] },
        } })
        const nextAdvanceBalance = Math.max(0, Number(advance.remaining_amount) - applied)
        await tx.vendor_advances.update({ where: { id: advance.id }, data: { remaining_amount: nextAdvanceBalance, state: nextAdvanceBalance <= 0.005 ? 'used' : 'partial', updated_at: postedAt } })
        advanceRemaining -= applied
      }
      const appliedAdvance = requestedAdvance - advanceRemaining
      const amountDue = Math.max(0, Number(bill.amount_total) - appliedAdvance)
      await tx.vendor_bills.update({ where: { id: billId }, data: { state: 'posted', payment_state: amountDue <= 0.005 ? 'paid' : amountDue < Number(bill.amount_total) ? 'partial' : 'not_paid', amount_due: amountDue, posted_at: postedAt, updated_at: postedAt } })
      return tx.vendor_bills.findUnique({ where: { id: billId }, include })
    }, { maxWait: 10000, timeout: 30000 })
    await logAudit({ userId: req.user?.id, action: 'Posted', entity: 'VendorBill', entityId: billId, description: `Posted vendor bill "${data.bill_number}"` })
    res.json({ success: true, message: 'Vendor bill posted successfully', data })
  } catch (error) { fail(res, error, 'Failed to post vendor bill') }
}

export const getRefunds = async (_req, res) => {
  try { res.json({ success: true, data: await prisma.vendor_bills.findMany({ where: { document_type: 'refund' }, include, orderBy: { created_at: 'desc' } }) }) }
  catch (error) { fail(res, error, 'Failed to fetch vendor refunds') }
}
export const createRefund = async (req, res) => {
  try {
    const prepared = await prepareBill(req.body, 'refund')
    const data = await prisma.$transaction(async (tx) => {
      const journal = await tx.journals.findUnique({ where: { id: prepared.header.journal_id } })
      const billNumber = await allocateNumber(tx, journal, 'REF')
      return tx.vendor_bills.create({ data: { ...prepared.header, bill_number: billNumber, vendor_bill_lines: { create: prepared.lines } }, include })
    }, { maxWait: 10000, timeout: 30000 })
    await logAudit({ userId: req.user?.id, action: 'Created', entity: 'VendorRefund', entityId: data.id, description: `Prepared vendor refund "${data.bill_number}"` })
    res.status(201).json({ success: true, message: 'Draft vendor refund prepared successfully', data })
  } catch (error) { fail(res, error, 'Failed to prepare vendor refund') }
}
export const updateRefund = async (req, res) => {
  const refundId = parseId(req.params.id)
  if (!refundId) return res.status(400).json({ success: false, message: 'Invalid refund id' })
  try {
    const existing = await prisma.vendor_bills.findFirst({ where: { id: refundId, document_type: 'refund' } })
    if (!existing) return res.status(404).json({ success: false, message: 'Vendor refund not found' })
    if (existing.state !== 'draft') throw inputError('Only draft refunds can be edited')
    const prepared = await prepareBill(req.body, 'refund')
    const data = await prisma.$transaction(async (tx) => {
      await tx.vendor_bill_lines.deleteMany({ where: { bill_id: refundId } })
      return tx.vendor_bills.update({ where: { id: refundId }, data: { ...prepared.header, bill_number: existing.bill_number, vendor_bill_lines: { create: prepared.lines }, updated_at: new Date() }, include })
    }, { maxWait: 10000, timeout: 30000 })
    res.json({ success: true, message: 'Draft vendor refund updated successfully', data })
  } catch (error) { fail(res, error, 'Failed to update vendor refund') }
}
export const removeRefund = async (req, res) => {
  const refundId = parseId(req.params.id)
  if (!refundId) return res.status(400).json({ success: false, message: 'Invalid refund id' })
  try {
    const refund = await prisma.vendor_bills.findFirst({ where: { id: refundId, document_type: 'refund' } })
    if (!refund) return res.status(404).json({ success: false, message: 'Vendor refund not found' })
    if (refund.state !== 'draft') throw inputError('Only draft refunds can be deleted')
    await prisma.vendor_bills.delete({ where: { id: refundId } })
    res.json({ success: true, message: 'Draft vendor refund deleted successfully' })
  } catch (error) { fail(res, error, 'Failed to delete vendor refund') }
}
export const postRefund = async (req, res) => {
  const refundId = parseId(req.params.id)
  if (!refundId) return res.status(400).json({ success: false, message: 'Invalid refund id' })
  try {
    const data = await prisma.$transaction(async (tx) => {
      const refund = await tx.vendor_bills.findFirst({ where: { id: refundId, document_type: 'refund' } })
      if (!refund || refund.state !== 'draft') throw inputError('Draft vendor refund not found')
      if (refund.reversed_bill_id) {
        const original = await tx.vendor_bills.findUnique({ where: { id: refund.reversed_bill_id } })
        if (!original || original.state !== 'posted') throw inputError('Original posted bill is missing')
        const amountDue = Math.max(0, Number(original.amount_due) - Number(refund.amount_total))
        await tx.vendor_bills.update({ where: { id: original.id }, data: { amount_due: amountDue, payment_state: amountDue <= 0.005 ? 'reversed' : amountDue < Number(original.amount_total) ? 'partial' : original.payment_state, updated_at: new Date() } })
      }
      const postedAt = new Date()
      await tx.vendor_bills.update({ where: { id: refundId }, data: { state: 'posted', payment_state: 'reversed', amount_due: 0, posted_at: postedAt, updated_at: postedAt } })
      return tx.vendor_bills.findUnique({ where: { id: refundId }, include })
    }, { maxWait: 10000, timeout: 30000 })
    await logAudit({ userId: req.user?.id, action: 'Posted', entity: 'VendorRefund', entityId: refundId, description: `Posted vendor refund "${data.bill_number}"` })
    res.json({ success: true, message: 'Vendor refund posted successfully', data })
  } catch (error) { fail(res, error, 'Failed to post vendor refund') }
}
