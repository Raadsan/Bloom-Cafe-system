import prisma from '../config/db.js'

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

// CREATE PUBLIC ORDER
export const createPublicOrder = async (req, res) => {
  try {
    let { qrCode, customerName, customerPhone, notes, items } = req.body

    customerName = customerName?.trim()
    customerPhone = customerPhone?.trim()
    notes = notes?.trim()

    if (!qrCode || !customerName || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'qrCode, customerName and items are required'
      })
    }

    const table = await prisma.table.findUnique({
      where: { qrCode }
    })

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Invalid QR code or table not found'
      })
    }

    let total = 0
    const orderItemsData = []

    for (const item of items) {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: Number(item.menuItemId) }
      })

      if (!menuItem) {
        return res.status(404).json({
          success: false,
          message: `Menu item with id ${item.menuItemId} not found`
        })
      }

      if (!menuItem.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `${menuItem.name} is not available`
        })
      }

      const quantity = Number(item.quantity) || 1
      const unitPrice = menuItem.price

      total += quantity * unitPrice

      orderItemsData.push({
        menuItemId: menuItem.id,
        quantity,
        unitPrice
      })
    }

    const order = await prisma.order.create({
      data: {
        tableId: table.id,
        customerName,
        customerPhone: customerPhone || null,
        notes: notes || null,
        total,
        status: 'pending',
        items: {
          create: orderItemsData
        }
      },
      include: {
        table: true,
        items: {
          include: {
            menuItem: true
          }
        }
      }
    })

    await prisma.table.update({
      where: { id: table.id },
      data: {
        status: 'occupied'
      }
    })

    res.status(201).json({
      success: true,
      message: 'Customer order created successfully',
      data: order
    })
  } catch (error) {
    console.error('Create Public Order Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create public order',
      error: error.message
    })
  }
}