import prisma from '../../../../config/db.js'
import { logAudit } from '../../../../utils/auditHelper.js'

const includePurchase = {
  supplier: { select: { id: true, name: true, phone: true } },
  lines: { include: { ingredient: { select: { id: true, name: true, unit: true } } } },
}

const validId = (value) => Number.isInteger(Number(value)) && Number(value) > 0 ? Number(value) : null
const money = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100

async function allocateEntryNumber(tx, journal, companyId) {
  for (;;) {
    const updated = await tx.journals.update({ where: { id: journal.id }, data: { next_sequence: { increment: 1 } }, select: { next_sequence: true } })
    const prefix = journal.sequence_prefix || journal.code || 'PUR'
    const entryNumber = `${prefix}${String(updated.next_sequence - 1).padStart(6, '0')}`
    const exists = await tx.journal_entries.findFirst({ where: { company_id: companyId, entry_number: entryNumber }, select: { id: true } })
    if (!exists) return entryNumber
  }
}

async function postPurchaseAccounting(tx, purchase, supplier) {
  const company = await tx.companies.findUnique({ where: { id: supplier.company_id } })
  if (!company?.is_active) throw Object.assign(new Error('Supplier company is inactive or missing'), { status: 400 })
  const [journal, fiscalPeriod, payableAccount, expenseAccount] = await Promise.all([
    tx.journals.findFirst({ where: { company_id: company.id, code: 'BILL', journal_type: 'purchase', is_active: true } }),
    tx.fiscal_periods.findFirst({ where: { state: 'open', fiscal_years: { company_id: company.id, state: 'open' }, start_date: { lte: purchase.purchaseDate }, end_date: { gte: purchase.purchaseDate } }, orderBy: { period_number: 'asc' } }),
    tx.chart_of_accounts.findFirst({ where: { company_id: company.id, is_active: true, OR: [{ code: '2000' }, ...(supplier.payable_account_id ? [{ id: supplier.payable_account_id }] : [])] }, orderBy: { code: 'asc' } }),
    tx.chart_of_accounts.findFirst({ where: { company_id: company.id, is_active: true, account_types: { internal_group: 'expense' } }, orderBy: { code: 'asc' } }),
  ])
  if (!journal) throw Object.assign(new Error('Active Vendor Bills journal (BILL) was not found'), { status: 400 })
  if (!fiscalPeriod) throw Object.assign(new Error('No open fiscal period covers the purchase date'), { status: 400 })
  if (!payableAccount) throw Object.assign(new Error('Accounts Payable account 2000 was not found'), { status: 400 })
  if (!expenseAccount) throw Object.assign(new Error('Configure an active expense account before recording purchases'), { status: 400 })

  const amount = Number(purchase.totalAmount)
  const postedAt = new Date()
  const entry = await tx.journal_entries.create({
    data: {
      company_id: company.id,
      journal_id: journal.id,
      entry_number: await allocateEntryNumber(tx, journal, company.id),
      entry_date: purchase.purchaseDate,
      fiscal_period_id: fiscalPeriod.id,
      reference: purchase.purchaseNumber,
      narration: `Restaurant inventory purchase ${purchase.purchaseNumber}`,
      state: 'posted',
      source_type: 'restaurant_purchase',
      source_id: purchase.id,
      posted_at: postedAt,
      journal_items: { create: [
        { sequence: 10, account_id: expenseAccount.id, label: 'Ingredients purchase', partner_type: 'vendor', partner_id: supplier.id, debit: amount, credit: 0, currency_id: company.currency_id, amount_currency: amount },
        { sequence: 20, account_id: payableAccount.id, label: 'Accounts Payable', partner_type: 'vendor', partner_id: supplier.id, debit: 0, credit: amount, currency_id: company.currency_id, amount_currency: -amount },
      ] },
    },
  })
  await tx.purchase.update({ where: { id: purchase.id }, data: { companyId: company.id, journalEntryId: entry.id } })
}

function parseLines(lines) {
  if (!Array.isArray(lines) || !lines.length) throw Object.assign(new Error('Add at least one purchase line'), { status: 400 })
  return lines.map((line) => {
    const ingredientId = validId(line?.ingredientId)
    const quantity = Number(line?.quantity)
    const unitCost = Number(line?.unitCost)
    if (!ingredientId || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitCost) || unitCost < 0) {
      throw Object.assign(new Error('Each line needs an ingredient, a positive quantity, and a valid unit cost'), { status: 400 })
    }
    return { ingredientId, quantity, unitCost, lineTotal: money(quantity * unitCost) }
  })
}

export async function listPurchases(req, res) {
  try {
    const data = await prisma.purchase.findMany({ include: includePurchase, orderBy: [{ purchaseDate: 'desc' }, { id: 'desc' }] })
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch purchases' })
  }
}

export async function getPurchase(req, res) {
  const id = validId(req.params.id)
  if (!id) return res.status(400).json({ success: false, message: 'Invalid purchase id' })
  try {
    const data = await prisma.purchase.findUnique({ where: { id }, include: includePurchase })
    if (!data) return res.status(404).json({ success: false, message: 'Purchase not found' })
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch purchase' })
  }
}

export async function createPurchase(req, res) {
  const supplierId = validId(req.body?.supplierId)
  const purchaseDate = new Date(req.body?.purchaseDate)
  if (!supplierId || Number.isNaN(purchaseDate.getTime())) return res.status(400).json({ success: false, message: 'Supplier and purchase date are required' })

  let lines
  try { lines = parseLines(req.body?.lines) } catch (error) { return res.status(error.status || 400).json({ success: false, message: error.message }) }
  const duplicateIngredient = new Set()
  if (lines.some((line) => duplicateIngredient.has(line.ingredientId) || !duplicateIngredient.add(line.ingredientId))) {
    return res.status(400).json({ success: false, message: 'Each ingredient can be added only once' })
  }

  try {
    // Receiving stock plus creating its accounting entry can exceed Prisma's
    // default 5-second interactive transaction limit on a remote database.
    const result = await prisma.$transaction(async (tx) => {
      const supplier = await tx.vendors.findUnique({ where: { id: supplierId }, select: { id: true, is_active: true, company_id: true, payable_account_id: true } })
      if (!supplier || !supplier.is_active) throw Object.assign(new Error('Select an active supplier'), { status: 400 })
      const ingredients = await tx.ingredient.findMany({ where: { id: { in: lines.map((line) => line.ingredientId) }, isActive: true } })
      if (ingredients.length !== lines.length) throw Object.assign(new Error('One or more selected ingredients are unavailable'), { status: 400 })

      const number = `PUR-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
      const purchase = await tx.purchase.create({
        data: {
          purchaseNumber: number,
          supplierId,
          purchaseDate,
          notes: String(req.body?.notes || '').trim() || null,
          totalAmount: money(lines.reduce((sum, line) => sum + line.lineTotal, 0)),
          lines: { create: lines },
        },
      })

      for (const line of lines) {
        await tx.ingredient.update({ where: { id: line.ingredientId }, data: { stockQuantity: { increment: line.quantity }, costPerUnit: line.unitCost } })
        await tx.stockmovement.create({ data: { ingredientId: line.ingredientId, purchaseId: purchase.id, type: 'in', quantity: line.quantity, note: `Purchase ${number}` } })
      }
      await postPurchaseAccounting(tx, purchase, supplier)
      return tx.purchase.findUnique({ where: { id: purchase.id }, include: includePurchase })
    }, { maxWait: 10000, timeout: 30000 })
    await logAudit({ userId: req.user?.id, action: 'Created', entity: 'Purchase', entityId: result.id, description: `Received purchase "${result.purchaseNumber}"` })
    res.status(201).json({ success: true, message: 'Purchase received and stock updated', data: result })
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message || 'Failed to create purchase' })
  }
}

export async function deletePurchase(req, res) {
  const id = validId(req.params.id)
  if (!id) return res.status(400).json({ success: false, message: 'Invalid purchase id' })
  try {
    const deleted = await prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.findUnique({ where: { id }, include: { lines: { include: { ingredient: true } } } })
      if (!purchase) throw Object.assign(new Error('Purchase not found'), { status: 404 })
      if (purchase.journalEntryId) throw Object.assign(new Error('This purchase is posted to accounting and cannot be deleted. Create a vendor refund or reversal instead.'), { status: 400 })
      const consumed = purchase.lines.find((line) => line.ingredient.stockQuantity < line.quantity)
      if (consumed) throw Object.assign(new Error(`Cannot delete this purchase because ${consumed.ingredient.name} stock has already been used`), { status: 400 })
      for (const line of purchase.lines) await tx.ingredient.update({ where: { id: line.ingredientId }, data: { stockQuantity: { decrement: line.quantity } } })
      await tx.purchase.delete({ where: { id } })
      return purchase
    })
    await logAudit({ userId: req.user?.id, action: 'Deleted', entity: 'Purchase', entityId: id, description: `Deleted purchase "${deleted.purchaseNumber}" and reversed stock` })
    res.json({ success: true, message: 'Purchase deleted and stock reversed' })
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message || 'Failed to delete purchase' })
  }
}
