import prisma from '../../../../config/db.js'
import { logAudit } from '../../../../utils/auditHelper.js'

const includePurchase = {
  supplier: { select: { id: true, name: true, phone: true } },
  lines: { include: { ingredient: { select: { id: true, name: true, unit: true } } } },
}

const validId = (value) => Number.isInteger(Number(value)) && Number(value) > 0 ? Number(value) : null
const money = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100

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
    const result = await prisma.$transaction(async (tx) => {
      const supplier = await tx.vendors.findUnique({ where: { id: supplierId }, select: { id: true, is_active: true } })
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
      return tx.purchase.findUnique({ where: { id: purchase.id }, include: includePurchase })
    })
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
