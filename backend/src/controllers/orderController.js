import prisma from '../config/db.js'

// CREATE ORDER (STAFF)
export const createOrder = async (req, res) => {
  try {
    const { tableId, customerName, customerPhone, notes, items } = req.body

    if (!tableId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'tableId and items are required'
      })
    }

    const table = await prisma.table.findUnique({
      where: { id: Number(tableId) }
    })

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
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

    let customer = null

    if (customerName && customerPhone) {
      customer = await prisma.customer.findUnique({
        where: { phone: customerPhone.trim() }
      })

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            fullName: customerName.trim(),
            phone: customerPhone.trim()
          }
        })
      } else {
        customer = await prisma.customer.update({
          where: { id: customer.id },
          data: {
            fullName: customerName.trim()
          }
        })
      }
    }

    const order = await prisma.order.create({
      data: {
        tableId: Number(tableId),
        customerId: customer ? customer.id : null,
        customerName: customerName || null,
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
        customer: true,
        items: {
          include: {
            menuItem: true
          }
        }
      }
    })

    await prisma.table.update({
      where: { id: Number(tableId) },
      data: {
        status: 'occupied'
      }
    })

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    })
  } catch (error) {
    console.error('Create Order Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    })
  }
}
// GET ALL ORDERS
export const getAllOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        table: true,
        customer: true,
        items: {
          include: {
            menuItem: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    })
  } catch (error) {
    console.error('Get Orders Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    })
  }
}

// GET ORDER BY ID
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params
    const orderId = parseInt(id)

    if (isNaN(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order id'
      })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        table: true,
        customer: true,
        items: {
          include: {
            menuItem: true
          }
        }
      }
    })

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      })
    }

    res.status(200).json({
      success: true,
      data: order
    })
  } catch (error) {
    console.error('Get Order By Id Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    })
  }
}

// UPDATE ORDER STATUS
// export const updateOrderStatus = async (req, res) => {
//   try {
//     const { id } = req.params
//     const { status } = req.body

//     const orderId = parseInt(id)

//     if (isNaN(orderId)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid order id'
//       })
//     }

//     const allowedStatuses = ['pending', 'preparing', 'ready', 'served', 'cancelled']

//     if (!status || !allowedStatuses.includes(status)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid status. Allowed: pending, preparing, ready, served, cancelled'
//       })
//     }

//     const existingOrder = await prisma.order.findUnique({
//       where: { id: orderId }
//     })

//     if (!existingOrder) {
//       return res.status(404).json({
//         success: false,
//         message: 'Order not found'
//       })
//     }

//     const updatedOrder = await prisma.order.update({
//       where: { id: orderId },
//       data: { status },
//       include: {
//         table: true,
//         customer: true,
//         items: {
//           include: {
//             menuItem: true
//           }
//         }
//       }
//     })

//     if (status === 'served' || status === 'cancelled') {
//       const tableOrders = await prisma.order.findMany({
//         where: {
//           tableId: existingOrder.tableId,
//           status: {
//             in: ['pending', 'preparing', 'ready']
//           }
//         }
//       })

//       if (tableOrders.length === 0) {
//         await prisma.table.update({
//           where: { id: existingOrder.tableId },
//           data: { status: 'available' }
//         })
//       }
//     }

//     res.status(200).json({
//       success: true,
//       message: 'Order status updated successfully',
//       data: updatedOrder
//     })
//   } catch (error) {
//     console.error('Update Order Status Error:', error)
//     res.status(500).json({
//       success: false,
//       message: 'Failed to update order status',
//       error: error.message
//     })
//   }
// }

// DELETE ORDER
export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params
    const orderId = parseInt(id)

    if (isNaN(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order id'
      })
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true
      }
    })

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      })
    }

    await prisma.orderItem.deleteMany({
      where: { orderId }
    })

    await prisma.order.delete({
      where: { id: orderId }
    })

    const remainingOrders = await prisma.order.findMany({
      where: {
        tableId: existingOrder.tableId,
        status: {
          in: ['pending', 'preparing', 'ready']
        }
      }
    })

    if (remainingOrders.length === 0) {
      await prisma.table.update({
        where: { id: existingOrder.tableId },
        data: { status: 'available' }
      })
    }

    res.status(200).json({
      success: true,
      message: 'Order deleted successfully'
    })
  } catch (error) {
    console.error('Delete Order Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete order',
      error: error.message
    })
  }
}

// GET ORDERS BY TABLE
export const getOrdersByTable = async (req, res) => {
  try {
    const { tableId } = req.params
    const id = parseInt(tableId)

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid table id'
      })
    }

    const orders = await prisma.order.findMany({
      where: {
        tableId: id
      },
      include: {
        table: true,
        customer: true,
        items: {
          include: {
            menuItem: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    })
  } catch (error) {
    console.error('Get Orders By Table Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders by table',
      error: error.message
    })
  }
}

// CREATE PUBLIC ORDER (CUSTOMER)
export const createPublicOrder = async (req, res) => {
  try {
    const { tableId, items } = req.body

    if (!tableId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "tableId and items are required"
      })
    }

    const result = await prisma.$transaction(async (tx) => {

      // 1. CHECK TABLE
      const table = await tx.table.findUnique({
        where: { id: Number(tableId) }
      })

      if (!table) {
        throw new Error("Table not found")
      }

      let total = 0
      const orderItemsData = []

      // 2. VALIDATE MENU ITEMS + CALCULATE TOTAL
      for (const item of items) {
        const menuItem = await tx.menuItem.findUnique({
          where: { id: Number(item.menuItemId) }
        })

        if (!menuItem) {
          throw new Error(`Menu item ${item.menuItemId} not found`)
        }

        if (!menuItem.isAvailable) {
          throw new Error(`${menuItem.name} is not available`)
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

      // 3. CREATE ORDER
      const order = await tx.order.create({
        data: {
          tableId: Number(tableId),
          total,
          status: "pending",
          items: {
            create: orderItemsData
          }
        },
        include: {
          items: true
        }
      })

      // 4. STOCK AUTO-DEDUCTION
      for (const item of orderItemsData) {

        const bomItems = await tx.menuItemBOM.findMany({
          where: { menuItemId: item.menuItemId }
        })

        for (const bom of bomItems) {

          const totalRequired = bom.quantity * item.quantity

          const ingredient = await tx.ingredient.findUnique({
            where: { id: bom.ingredientId }
          })

          if (!ingredient || ingredient.stockQuantity < totalRequired) {
            throw new Error(
              `Not enough stock for ingredient ID ${bom.ingredientId}`
            )
          }

          // UPDATE STOCK
          await tx.ingredient.update({
            where: { id: bom.ingredientId },
            data: {
              stockQuantity: {
                decrement: totalRequired
              }
            }
          })

          // STOCK MOVEMENT LOG
          await tx.stockMovement.create({
            data: {
              ingredientId: bom.ingredientId,
              type: "out",
              quantity: totalRequired,
              note: `Auto deduction for order ${order.id}`
            }
          })
        }
      }

      // 5. UPDATE TABLE STATUS
      await tx.table.update({
        where: { id: Number(tableId) },
        data: { status: "occupied" }
      })

      return order
    })

    res.status(201).json({
      success: true,
      message: "Order created successfully with stock deduction",
      data: result
    })

  } catch (error) {
    console.error("Create Public Order Error:", error)

    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// UPDATE ORDER STATUS
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const orderId = parseInt(id)

    if (isNaN(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order id'
      })
    }

    const allowedStatuses = ['pending', 'preparing', 'ready', 'served', 'cancelled']

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Allowed: pending, preparing, ready, served, cancelled'
      })
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        table: true,
        customer: true,
        items: {
          include: {
            menuItem: true
          }
        }
      }
    })

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      })
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        table: true,
        customer: true,
        items: {
          include: {
            menuItem: true
          }
        }
      }
    })

    // NOTIFICATIONS BY STATUS
    if (status === 'preparing') {
  await prisma.notification.createMany({
    data: [
      {
        title: 'Order Preparing',
        message: `Kitchen started preparing order for Table ${updatedOrder.table.number}`,
        role: 'admin',
        orderId: updatedOrder.id
      },
      {
        title: 'Order Preparing',
        message: `Kitchen started preparing order for Table ${updatedOrder.table.number}`,
        role: 'manager',
        orderId: updatedOrder.id
      },
      {
        title: 'Order Preparing',
        message: 'Kitchen is preparing your order',
        role: 'customer',
        orderId: updatedOrder.id,
        customerId: updatedOrder.customerId
      }
    ]
  })
}

    if (status === 'ready') {
  await prisma.notification.createMany({
    data: [
      {
        title: 'Order Ready',
        message: `Order for Table ${updatedOrder.table.number} is ready`,
        role: 'waiter',
        orderId: updatedOrder.id
      },
      {
        title: 'Order Ready',
        message: `Order for Table ${updatedOrder.table.number} is ready`,
        role: 'admin',
        orderId: updatedOrder.id
      },
      {
        title: 'Order Ready',
        message: `Order for Table ${updatedOrder.table.number} is ready`,
        role: 'manager',
        orderId: updatedOrder.id
      },
      {
        title: 'Order Ready',
        message: 'Your order is ready',
        role: 'customer',
        orderId: updatedOrder.id,
        customerId: updatedOrder.customerId
      }
    ]
  })
}

    if (status === 'served') {
  await prisma.notification.createMany({
    data: [
      {
        title: 'Order Served',
        message: `Order for Table ${updatedOrder.table.number} has been served`,
        role: 'admin',
        orderId: updatedOrder.id
      },
      {
        title: 'Order Served',
        message: `Order for Table ${updatedOrder.table.number} has been served`,
        role: 'manager',
        orderId: updatedOrder.id
      },
      {
        title: 'Order Served',
        message: 'Your order has been served',
        role: 'customer',
        orderId: updatedOrder.id,
        customerId: updatedOrder.customerId
      }
    ]
  })
}

   if (status === 'cancelled') {
  await prisma.notification.createMany({
    data: [
      {
        title: 'Order Cancelled',
        message: `Order for Table ${updatedOrder.table.number} was cancelled`,
        role: 'admin',
        orderId: updatedOrder.id
      },
      {
        title: 'Order Cancelled',
        message: `Order for Table ${updatedOrder.table.number} was cancelled`,
        role: 'manager',
        orderId: updatedOrder.id
      },
      {
        title: 'Order Cancelled',
        message: 'Your order was cancelled',
        role: 'customer',
        orderId: updatedOrder.id,
        customerId: updatedOrder.customerId
      }
    ]
  })
}

    // UPDATE TABLE STATUS IF ORDER FINISHED
    if (status === 'served' || status === 'cancelled') {
      const activeOrders = await prisma.order.findMany({
        where: {
          tableId: existingOrder.tableId,
          status: {
            in: ['pending', 'preparing', 'ready']
          }
        }
      })

      if (activeOrders.length === 0) {
        await prisma.table.update({
          where: { id: existingOrder.tableId },
          data: { status: 'available' }
        })
      }
    }

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: updatedOrder
    })
  } catch (error) {
    console.error('Update Order Status Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    })
  }
}