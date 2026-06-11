import prisma from '../config/db.js'
import { logAudit } from '../utils/auditHelper.js'

function normalizeDiscountInput(discountType, discountValue, price) {
  const value = Math.max(0, Number(discountValue) || 0)
  const basePrice = Math.max(0, Number(price) || 0)

  if (!value || !discountType) {
    return { discountType: null, discountValue: 0 }
  }

  const type =
    discountType === 'fixed'
      ? 'fixed'
      : discountType === 'percentage'
        ? 'percentage'
        : null

  if (!type) {
    return { discountType: null, discountValue: 0 }
  }

  if (type === 'percentage') {
    return { discountType: type, discountValue: Math.min(100, value) }
  }

  return { discountType: type, discountValue: Math.min(basePrice, value) }
}

function normalizeOptionsInput(raw) {
  if (raw === undefined) return undefined
  if (raw === null || raw === '') return null
  if (Array.isArray(raw)) {
    const list = raw.map(String).map(s => s.trim()).filter(Boolean)
    return list.length ? list : null
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        const list = parsed.map(String).map(s => s.trim()).filter(Boolean)
        return list.length ? list : null
      }
    } catch {
      const list = raw.split(',').map(s => s.trim()).filter(Boolean)
      return list.length ? list : null
    }
  }
  return null
}

// CREATE MENU ITEM
export const createMenuItem = async (req, res) => {
  try {
    const { name, description, costPrice, price, tax, imageUrl, categoryId, isAvailable, isRecommended, options, discountType, discountValue } = req.body

    if (!name || price === undefined || !categoryId) {
      return res.status(400).json({
        success: false,
        message: 'name, price, and categoryId are required'
      })
    }

    const cat = await prisma.category.findUnique({
      where: { id: Number(categoryId) }
    })

    if (!cat) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      })
    }

    const parsedPrice = Number(price)
    const discount = normalizeDiscountInput(discountType, discountValue, parsedPrice)

    const item = await prisma.menuitem.create({
      data: {
        name: name.trim(),
        description: description?.trim() ? description.trim() : null,
        costPrice: costPrice !== undefined ? Number(costPrice) : null,
        price: parsedPrice,
        tax: tax !== undefined ? Number(tax) : 0,
        discountType: discount.discountType,
        discountValue: discount.discountValue,
        imageUrl: imageUrl || null,
        categoryId: Number(categoryId),
        isAvailable: typeof isAvailable === 'boolean' ? isAvailable : true,
        isRecommended: typeof isRecommended === 'boolean' ? isRecommended : false,
        options: normalizeOptionsInput(options),
      },
      include: {
        category: true
      }
    })

    logAudit({ userId: req.user?.id, action: 'Created', entity: 'MenuItem', entityId: item.id, description: `Created menu item "${item.name}"` })

    return res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      data: item
    })
  } catch (error) {
    console.error('Create MenuItem Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create menu item',
      error: error.message
    })
  }
}

// GET ALL MENU ITEMS
export const getAllMenuItems = async (req, res) => {
  try {
    const items = await prisma.menuitem.findMany({
      include: {
        category: {
          select: { id: true, name: true }
        }
      },
      orderBy: { id: 'asc' }
    })

    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    })
  } catch (error) {
    console.error('Get MenuItems Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu items',
      error: error.message
    })
  }
}

// GET MENU ITEMS BY CATEGORY
export const getMenuItemsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params

    const items = await prisma.menuitem.findMany({
      where: { categoryId: Number(categoryId) },
      include: {
        category: { select: { id: true, name: true } }
      },
      orderBy: { id: 'asc' }
    })

    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    })
  } catch (error) {
    console.error('Get MenuItems By Category Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu items by category',
      error: error.message
    })
  }
}

// UPDATE MENU ITEM
export const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, costPrice, price, tax, imageUrl, categoryId, isAvailable, isRecommended, options, discountType, discountValue } = req.body

    const itemId = Number(id)
    if (isNaN(itemId)) {
      return res.status(400).json({ success: false, message: 'Invalid menu item id' })
    }

    const existing = await prisma.menuitem.findUnique({ where: { id: itemId } })
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Menu item not found' })
    }

    if (categoryId) {
      const cat = await prisma.category.findUnique({ where: { id: Number(categoryId) } })
      if (!cat) {
        return res.status(404).json({ success: false, message: 'Category not found' })
      }
    }

    const nextPrice = price !== undefined ? Number(price) : existing.price
    const nextDiscountType =
      discountType !== undefined ? discountType : existing.discountType
    const nextDiscountValue =
      discountValue !== undefined ? discountValue : existing.discountValue
    const discount = normalizeDiscountInput(
      nextDiscountType,
      nextDiscountValue,
      nextPrice
    )

    const updated = await prisma.menuitem.update({
      where: { id: itemId },
      data: {
        name: name ?? existing.name,
        description:
          description !== undefined
            ? description?.trim()
              ? description.trim()
              : null
            : existing.description,
        costPrice: costPrice !== undefined ? Number(costPrice) : existing.costPrice,
        price: nextPrice,
        tax: tax !== undefined ? Number(tax) : existing.tax,
        discountType: discount.discountType,
        discountValue: discount.discountValue,
        imageUrl: imageUrl !== undefined ? imageUrl : existing.imageUrl,
        categoryId: categoryId ? Number(categoryId) : existing.categoryId,
        isAvailable: typeof isAvailable === 'boolean' ? isAvailable : existing.isAvailable,
        isRecommended: typeof isRecommended === 'boolean' ? isRecommended : (existing.isRecommended ?? false),
        ...(options !== undefined ? { options: normalizeOptionsInput(options) } : {}),
      },
      include: {
        category: { select: { id: true, name: true } }
      }
    })

    logAudit({ userId: req.user?.id, action: 'Updated', entity: 'MenuItem', entityId: updated.id, description: `Updated menu item "${updated.name}"` })

    return res.status(200).json({
      success: true,
      message: 'Menu item updated successfully',
      data: updated
    })
  } catch (error) {
    console.error('Update MenuItem Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update menu item',
      error: error.message
    })
  }
}

// DELETE MENU ITEM
export const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params
    const itemId = Number(id)

    if (isNaN(itemId)) {
      return res.status(400).json({ success: false, message: 'Invalid menu item id' })
    }

    const existing = await prisma.menuitem.findUnique({ where: { id: itemId } })
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Menu item not found' })
    }

    await prisma.menuitem.delete({ where: { id: itemId } })

    logAudit({ userId: req.user?.id, action: 'Deleted', entity: 'MenuItem', entityId: itemId, description: `Deleted menu item "${existing.name}"` })

    return res.status(200).json({
      success: true,
      message: 'Menu item deleted successfully'
    })
  } catch (error) {
    console.error('Delete MenuItem Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete menu item',
      error: error.message
    })
  }
}

// GET PUBLIC MENU BY QR CODE
export const getPublicMenuByQrCode = async (req, res) => {
  try {
    const { qrCode } = req.params

    const table = await prisma.table.findUnique({
      where: { qrCode }
    })

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Invalid QR code or table not found'
      })
    }

    const categories = await prisma.category.findMany({
      include: {
        menuitem: {
          where: {
            isAvailable: true
          },
          orderBy: {
            id: 'asc'
          }
        }
      },
      orderBy: {
        id: 'asc'
      }
    })

    res.status(200).json({
      success: true,
      data: {
        table,
        categories
      }
    })
  } catch (error) {
    console.error('Get Public Menu Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch public menu',
      error: error.message
    })
  }
}