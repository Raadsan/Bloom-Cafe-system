import prisma from '../../../../config/db.js'
import { logAudit } from '../../../../utils/auditHelper.js'

const include = {
  vendors: { select: { id: true, name: true, vendor_code: true } },
  currencies: { select: { id: true, code: true, symbol: true } },
  payment_methods: { select: { id: true, name: true, code: true } },
  journals: { select: { id: true, name: true, code: true } },
  bank_accounts: { select: { id: true, account_name: true, account_number: true } },
  payment_allocations: { include: { vendor_bills: { select: { id: true, bill_number: true, bill_date: true, amount_total: true, amount_due: true } } } },
}
const id = (value) => { const parsed = Number(value); return Number.isInteger(parsed) && parsed > 0 ? parsed : null }
const date = (value) => { const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? null : parsed }
const inputError = (message) => Object.assign(new Error(message), { status: 400 })
const fail = (res, error, fallback) => {
  console.error(fallback, error)
  return res.status(error.status || (error.code === 'P2025' ? 404 : 500)).json({ success: false, message: error.message || fallback })
}
async function prepare(input) {
  const vendorId = id(input.vendor_id)
  const paymentDate = date(input.payment_date)
  const paymentMethodId = id(input.payment_method_id)
  const bankAccountId = id(input.bank_account_id)
  const amount = Number(input.amount)
  if (!vendorId || !paymentDate || !paymentMethodId || !bankAccountId) throw inputError('Vendor, date, payment method, and bank account are required')
  if (!Number.isFinite(amount) || amount <= 0) throw inputError('Payment amount must be greater than zero')
  const [vendor, method, bank] = await Promise.all([
    prisma.vendors.findUnique({ where: { id: vendorId } }),
    prisma.payment_methods.findUnique({ where: { id: paymentMethodId } }),
    prisma.bank_accounts.findUnique({ where: { id: bankAccountId } }),
  ])
  if (!vendor?.is_active) throw inputError('Active vendor not found')
  if (!method?.is_active || !['outbound', 'both'].includes(method.payment_type)) throw inputError('Select an active outbound payment method')
  if (!bank?.is_active || bank.company_id !== vendor.company_id || !bank.journal_id) throw inputError('Select an active vendor-company bank account with a journal')
  const fiscalPeriod = await prisma.fiscal_periods.findFirst({ where: { state: 'open', fiscal_years: { company_id: vendor.company_id, state: 'open' }, start_date: { lte: paymentDate }, end_date: { gte: paymentDate } } })
  if (!fiscalPeriod) throw inputError('No open fiscal period covers the payment date')
  const currencyId = id(input.currency_id) || bank.currency_id
  if (currencyId !== bank.currency_id) throw inputError('Payment currency must match the selected bank account')
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
  return {
    header: { company_id: vendor.company_id, vendor_id: vendorId, journal_id: bank.journal_id, payment_method_id: paymentMethodId, bank_account_id: bankAccountId, fiscal_period_id: fiscalPeriod.id, payment_date: paymentDate, currency_id: currencyId, exchange_rate: exchangeRate, amount, unallocated_amount: Math.round((amount - allocated) * 100) / 100, reference: String(input.reference || '').trim() || null, memo: String(input.memo || '').trim() || null, state: 'draft' },
    allocations,
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
export const create = async (req, res) => {
  try {
    const prepared = await prepare(req.body)
    const data = await prisma.$transaction(async (tx) => tx.vendor_payments.create({ data: { ...prepared.header, payment_number: await number(tx, prepared.header.journal_id), payment_allocations: { create: prepared.allocations } }, include }), { maxWait: 10000, timeout: 30000 })
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
      return tx.vendor_payments.update({ where: { id: paymentId }, data: { ...prepared.header, payment_number: existing.payment_number, payment_allocations: { create: prepared.allocations }, updated_at: new Date() }, include })
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
    await prisma.vendor_payments.delete({ where: { id: paymentId } })
    res.json({ success: true, message: 'Draft vendor payment deleted successfully' })
  } catch (error) { fail(res, error, 'Failed to delete vendor payment') }
}
export const post = async (req, res) => {
  const paymentId = id(req.params.id)
  if (!paymentId) return res.status(400).json({ success: false, message: 'Invalid payment id' })
  try {
    const data = await prisma.$transaction(async (tx) => {
      const payment = await tx.vendor_payments.findUnique({ where: { id: paymentId }, include: { payment_allocations: true } })
      if (!payment || payment.state !== 'draft') throw inputError('Draft vendor payment not found')
      for (const allocation of payment.payment_allocations) {
        const bill = await tx.vendor_bills.findUnique({ where: { id: allocation.bill_id } })
        if (!bill || bill.state !== 'posted' || bill.vendor_id !== payment.vendor_id) throw inputError('An allocated bill is no longer available')
        const due = Math.max(0, Number(bill.amount_due) - Number(allocation.allocated_amount))
        await tx.vendor_bills.update({ where: { id: bill.id }, data: { amount_due: due, payment_state: due <= 0.005 ? 'paid' : 'partial', updated_at: new Date() } })
      }
      const postedAt = new Date()
      await tx.vendor_payments.update({ where: { id: paymentId }, data: { state: 'posted', posted_at: postedAt, updated_at: postedAt } })
      return tx.vendor_payments.findUnique({ where: { id: paymentId }, include })
    }, { maxWait: 10000, timeout: 30000 })
    await logAudit({ userId: req.user?.id, action: 'Posted', entity: 'VendorPayment', entityId: paymentId, description: `Posted vendor payment "${data.payment_number}"` })
    res.json({ success: true, message: 'Vendor payment posted successfully', data })
  } catch (error) { fail(res, error, 'Failed to post vendor payment') }
}
