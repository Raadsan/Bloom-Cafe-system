import prisma from '../config/db.js'

// CREATE MENU ITEM
export const createMenuItem = async (req, res) => {
  try {
    const { name, description, price, imageUrl, categoryId, isAvailable } = req.body

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

    const item = await prisma.menuItem.create({
      data: {
        name: name.trim(),
        description: description || null,
        price: Number(price),
        imageUrl: imageUrl || null,
        categoryId: Number(categoryId),
        isAvailable: typeof isAvailable === 'boolean' ? isAvailable : true
      },
      include: {
        category: true
      }
    })

    res.status(201).json({
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
    const items = await prisma.menuItem.findMany({
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

    const items = await prisma.menuItem.findMany({
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
    const { name, description, price, imageUrl, categoryId, isAvailable } = req.body

    const itemId = Number(id)
    if (isNaN(itemId)) {
      return res.status(400).json({ success: false, message: 'Invalid menu item id' })
    }

    const existing = await prisma.menuItem.findUnique({ where: { id: itemId } })
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Menu item not found' })
    }

    if (categoryId) {
      const cat = await prisma.category.findUnique({ where: { id: Number(categoryId) } })
      if (!cat) {
        return res.status(404).json({ success: false, message: 'Category not found' })
      }
    }

    const updated = await prisma.menuItem.update({
      where: { id: itemId },
      data: {
        name: name ?? existing.name,
        description: description !== undefined ? description : existing.description,
        price: price !== undefined ? Number(price) : existing.price,
        imageUrl: imageUrl !== undefined ? imageUrl : existing.imageUrl,
        categoryId: categoryId ? Number(categoryId) : existing.categoryId,
        isAvailable: typeof isAvailable === 'boolean' ? isAvailable : existing.isAvailable
      },
      include: {
        category: { select: { id: true, name: true } }
      }
    })

    res.status(200).json({
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

    const existing = await prisma.menuItem.findUnique({ where: { id: itemId } })
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Menu item not found' })
    }

    await prisma.menuItem.delete({ where: { id: itemId } })

    res.status(200).json({
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
        menuItems: {
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