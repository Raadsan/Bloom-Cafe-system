// import prisma from '../config/db.js'

// // CREATE ORDER (STAFF)
// export const createOrder = async (req, res) => {
//   try {
//     const { tableId, customerName, customerPhone, notes, items } = req.body

//     if (!tableId || !items || !Array.isArray(items) || items.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'tableId and items are required'
//       })
//     }

//     const table = await prisma.table.findUnique({
//       where: { id: Number(tableId) }
//     })

//     if (!table) {
//       return res.status(404).json({
//         success: false,
//         message: 'Table not found'
//       })
//     }

//     let total = 0
//     const orderItemsData = []

//     for (const item of items) {
//       const menuItem = await prisma.menuItem.findUnique({
//         where: { id: Number(item.menuItemId) }
//       })

//       if (!menuItem) {
//         return res.status(404).json({
//           success: false,
//           message: `Menu item with id ${item.menuItemId} not found`
//         })
//       }

//       if (!menuItem.isAvailable) {
//         return res.status(400).json({
//           success: false,
//           message: `${menuItem.name} is not available`
//         })
//       }

//       const quantity = Number(item.quantity) || 1
//       const unitPrice = menuItem.price

//       total += quantity * unitPrice

//       orderItemsData.push({
//         menuItemId: menuItem.id,
//         quantity,
//         unitPrice
//       })
//     }

//     let customer = null

//     if (customerName && customerPhone) {
//       customer = await prisma.customer.findUnique({
//         where: { phone: customerPhone.trim() }
//       })

//       if (!customer) {
//         customer = await prisma.customer.create({
//           data: {
//             fullName: customerName.trim(),
//             phone: customerPhone.trim()
//           }
//         })
//       } else {
//         customer = await prisma.customer.update({
//           where: { id: customer.id },
//           data: {
//             fullName: customerName.trim()
//           }
//         })
//       }
//     }

//     const order = await prisma.order.create({
//       data: {
//         tableId: Number(tableId),
//         customerId: customer ? customer.id : null,
//         customerName: customerName || null,
//         customerPhone: customerPhone || null,
//         notes: notes || null,
//         total,
//         status: 'pending',
//         items: {
//           create: orderItemsData
//         }
//       },
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

//     await prisma.table.update({
//       where: { id: Number(tableId) },
//       data: {
//         status: 'occupied'
//       }
//     })

//     res.status(201).json({
//       success: true,
//       message: 'Order created successfully',
//       data: order
//     })
//   } catch (error) {
//     console.error('Create Order Error:', error)
//     res.status(500).json({
//       success: false,
//       message: 'Failed to create order',
//       error: error.message
//     })
//   }
// }
// // GET ALL ORDERS
// export const getAllOrders = async (req, res) => {
//   try {
//     const orders = await prisma.order.findMany({
//       include: {
//         table: true,
//         customer: true,
//         items: {
//           include: {
//             menuItem: true
//           }
//         }
//       },
//       orderBy: {
//         createdAt: 'desc'
//       }
//     })

//     res.status(200).json({
//       success: true,
//       count: orders.length,
//       data: orders
//     })
//   } catch (error) {
//     console.error('Get Orders Error:', error)
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch orders',
//       error: error.message
//     })
//   }
// }

// // GET ORDER BY ID
// export const getOrderById = async (req, res) => {
//   try {
//     const { id } = req.params
//     const orderId = parseInt(id)

//     if (isNaN(orderId)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid order id'
//       })
//     }

//     const order = await prisma.order.findUnique({
//       where: { id: orderId },
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

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: 'Order not found'
//       })
//     }

//     res.status(200).json({
//       success: true,
//       data: order
//     })
//   } catch (error) {
//     console.error('Get Order By Id Error:', error)
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch order',
//       error: error.message
//     })
//   }
// }

// // UPDATE ORDER STATUS
// // export const updateOrderStatus = async (req, res) => {
// //   try {
// //     const { id } = req.params
// //     const { status } = req.body

// //     const orderId = parseInt(id)

// //     if (isNaN(orderId)) {
// //       return res.status(400).json({
// //         success: false,
// //         message: 'Invalid order id'
// //       })
// //     }

// //     const allowedStatuses = ['pending', 'preparing', 'ready', 'served', 'cancelled']

// //     if (!status || !allowedStatuses.includes(status)) {
// //       return res.status(400).json({
// //         success: false,
// //         message: 'Invalid status. Allowed: pending, preparing, ready, served, cancelled'
// //       })
// //     }

// //     const existingOrder = await prisma.order.findUnique({
// //       where: { id: orderId }
// //     })

// //     if (!existingOrder) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Order not found'
// //       })
// //     }

// //     const updatedOrder = await prisma.order.update({
// //       where: { id: orderId },
// //       data: { status },
// //       include: {
// //         table: true,
// //         customer: true,
// //         items: {
// //           include: {
// //             menuItem: true
// //           }
// //         }
// //       }
// //     })

// //     if (status === 'served' || status === 'cancelled') {
// //       const tableOrders = await prisma.order.findMany({
// //         where: {
// //           tableId: existingOrder.tableId,
// //           status: {
// //             in: ['pending', 'preparing', 'ready']
// //           }
// //         }
// //       })

// //       if (tableOrders.length === 0) {
// //         await prisma.table.update({
// //           where: { id: existingOrder.tableId },
// //           data: { status: 'available' }
// //         })
// //       }
// //     }

// //     res.status(200).json({
// //       success: true,
// //       message: 'Order status updated successfully',
// //       data: updatedOrder
// //     })
// //   } catch (error) {
// //     console.error('Update Order Status Error:', error)
// //     res.status(500).json({
// //       success: false,
// //       message: 'Failed to update order status',
// //       error: error.message
// //     })
// //   }
// // }

// // DELETE ORDER
// export const deleteOrder = async (req, res) => {
//   try {
//     const { id } = req.params
//     const orderId = parseInt(id)

//     if (isNaN(orderId)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid order id'
//       })
//     }

//     const existingOrder = await prisma.order.findUnique({
//       where: { id: orderId },
//       include: {
//         items: true
//       }
//     })

//     if (!existingOrder) {
//       return res.status(404).json({
//         success: false,
//         message: 'Order not found'
//       })
//     }

//     await prisma.orderItem.deleteMany({
//       where: { orderId }
//     })

//     await prisma.order.delete({
//       where: { id: orderId }
//     })

//     const remainingOrders = await prisma.order.findMany({
//       where: {
//         tableId: existingOrder.tableId,
//         status: {
//           in: ['pending', 'preparing', 'ready']
//         }
//       }
//     })

//     if (remainingOrders.length === 0) {
//       await prisma.table.update({
//         where: { id: existingOrder.tableId },
//         data: { status: 'available' }
//       })
//     }

//     res.status(200).json({
//       success: true,
//       message: 'Order deleted successfully'
//     })
//   } catch (error) {
//     console.error('Delete Order Error:', error)
//     res.status(500).json({
//       success: false,
//       message: 'Failed to delete order',
//       error: error.message
//     })
//   }
// }

// // GET ORDERS BY TABLE
// export const getOrdersByTable = async (req, res) => {
//   try {
//     const { tableId } = req.params
//     const id = parseInt(tableId)

//     if (isNaN(id)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid table id'
//       })
//     }

//     const orders = await prisma.order.findMany({
//       where: {
//         tableId: id
//       },
//       include: {
//         table: true,
//         customer: true,
//         items: {
//           include: {
//             menuItem: true
//           }
//         }
//       },
//       orderBy: {
//         createdAt: 'desc'
//       }
//     })

//     res.status(200).json({
//       success: true,
//       count: orders.length,
//       data: orders
//     })
//   } catch (error) {
//     console.error('Get Orders By Table Error:', error)
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch orders by table',
//       error: error.message
//     })
//   }
// }

// // CREATE PUBLIC ORDER (CUSTOMER)
// export const createPublicOrder = async (req, res) => {
//   try {
//     const { tableId, items } = req.body

//     if (!tableId || !items || !Array.isArray(items) || items.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "tableId and items are required"
//       })
//     }

//     const result = await prisma.$transaction(async (tx) => {

//       // 1. CHECK TABLE
//       const table = await tx.table.findUnique({
//         where: { id: Number(tableId) }
//       })

//       if (!table) {
//         throw new Error("Table not found")
//       }

//       let total = 0
//       const orderItemsData = []

//       // 2. VALIDATE MENU ITEMS + CALCULATE TOTAL
//       for (const item of items) {
//         const menuItem = await tx.menuItem.findUnique({
//           where: { id: Number(item.menuItemId) }
//         })

//         if (!menuItem) {
//           throw new Error(`Menu item ${item.menuItemId} not found`)
//         }

//         if (!menuItem.isAvailable) {
//           throw new Error(`${menuItem.name} is not available`)
//         }

//         const quantity = Number(item.quantity) || 1
//         const unitPrice = menuItem.price

//         total += quantity * unitPrice

//         orderItemsData.push({
//           menuItemId: menuItem.id,
//           quantity,
//           unitPrice
//         })
//       }

//       // 3. CREATE ORDER
//       const order = await tx.order.create({
//         data: {
//           tableId: Number(tableId),
//           total,
//           status: "pending",
//           items: {
//             create: orderItemsData
//           }
//         },
//         include: {
//           items: true
//         }
//       })

//       // 4. STOCK AUTO-DEDUCTION
//       for (const item of orderItemsData) {

//         const bomItems = await tx.menuItemBOM.findMany({
//           where: { menuItemId: item.menuItemId }
//         })

//         for (const bom of bomItems) {

//           const totalRequired = bom.quantity * item.quantity

//           const ingredient = await tx.ingredient.findUnique({
//             where: { id: bom.ingredientId }
//           })

//           if (!ingredient || ingredient.stockQuantity < totalRequired) {
//             throw new Error(
//               `Not enough stock for ingredient ID ${bom.ingredientId}`
//             )
//           }

//           // UPDATE STOCK
//           await tx.ingredient.update({
//             where: { id: bom.ingredientId },
//             data: {
//               stockQuantity: {
//                 decrement: totalRequired
//               }
//             }
//           })

//           // STOCK MOVEMENT LOG
//           await tx.stockMovement.create({
//             data: {
//               ingredientId: bom.ingredientId,
//               type: "out",
//               quantity: totalRequired,
//               note: `Auto deduction for order ${order.id}`
//             }
//           })
//         }
//       }

//       // 5. UPDATE TABLE STATUS
//       await tx.table.update({
//         where: { id: Number(tableId) },
//         data: { status: "occupied" }
//       })

//       return order
//     })

//     res.status(201).json({
//       success: true,
//       message: "Order created successfully with stock deduction",
//       data: result
//     })

//   } catch (error) {
//     console.error("Create Public Order Error:", error)

//     res.status(500).json({
//       success: false,
//       message: error.message
//     })
//   }
// }

// // UPDATE ORDER STATUS
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
//       where: { id: orderId },
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

//     // NOTIFICATIONS BY STATUS
//     if (status === 'preparing') {
//   await prisma.notification.createMany({
//     data: [
//       {
//         title: 'Order Preparing',
//         message: `Kitchen started preparing order for Table ${updatedOrder.table.number}`,
//         role: 'admin',
//         orderId: updatedOrder.id
//       },
//       {
//         title: 'Order Preparing',
//         message: `Kitchen started preparing order for Table ${updatedOrder.table.number}`,
//         role: 'manager',
//         orderId: updatedOrder.id
//       },
//       {
//         title: 'Order Preparing',
//         message: 'Kitchen is preparing your order',
//         role: 'customer',
//         orderId: updatedOrder.id,
//         customerId: updatedOrder.customerId
//       }
//     ]
//   })
// }

//     if (status === 'ready') {
//   await prisma.notification.createMany({
//     data: [
//       {
//         title: 'Order Ready',
//         message: `Order for Table ${updatedOrder.table.number} is ready`,
//         role: 'waiter',
//         orderId: updatedOrder.id
//       },
//       {
//         title: 'Order Ready',
//         message: `Order for Table ${updatedOrder.table.number} is ready`,
//         role: 'admin',
//         orderId: updatedOrder.id
//       },
//       {
//         title: 'Order Ready',
//         message: `Order for Table ${updatedOrder.table.number} is ready`,
//         role: 'manager',
//         orderId: updatedOrder.id
//       },
//       {
//         title: 'Order Ready',
//         message: 'Your order is ready',
//         role: 'customer',
//         orderId: updatedOrder.id,
//         customerId: updatedOrder.customerId
//       }
//     ]
//   })
// }

//     if (status === 'served') {
//   await prisma.notification.createMany({
//     data: [
//       {
//         title: 'Order Served',
//         message: `Order for Table ${updatedOrder.table.number} has been served`,
//         role: 'admin',
//         orderId: updatedOrder.id
//       },
//       {
//         title: 'Order Served',
//         message: `Order for Table ${updatedOrder.table.number} has been served`,
//         role: 'manager',
//         orderId: updatedOrder.id
//       },
//       {
//         title: 'Order Served',
//         message: 'Your order has been served',
//         role: 'customer',
//         orderId: updatedOrder.id,
//         customerId: updatedOrder.customerId
//       }
//     ]
//   })
// }

//    if (status === 'cancelled') {
//   await prisma.notification.createMany({
//     data: [
//       {
//         title: 'Order Cancelled',
//         message: `Order for Table ${updatedOrder.table.number} was cancelled`,
//         role: 'admin',
//         orderId: updatedOrder.id
//       },
//       {
//         title: 'Order Cancelled',
//         message: `Order for Table ${updatedOrder.table.number} was cancelled`,
//         role: 'manager',
//         orderId: updatedOrder.id
//       },
//       {
//         title: 'Order Cancelled',
//         message: 'Your order was cancelled',
//         role: 'customer',
//         orderId: updatedOrder.id,
//         customerId: updatedOrder.customerId
//       }
//     ]
//   })
// }

//     // UPDATE TABLE STATUS IF ORDER FINISHED
//     if (status === 'served' || status === 'cancelled') {
//       const activeOrders = await prisma.order.findMany({
//         where: {
//           tableId: existingOrder.tableId,
//           status: {
//             in: ['pending', 'preparing', 'ready']
//           }
//         }
//       })

//       if (activeOrders.length === 0) {
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



import prisma from '../config/db.js'
import { emitOrderUpdate } from '../utils/socketEvents.js'
import { notifyNewOrder, notifyOrderReady } from '../utils/orderNotifications.js'
import { logAudit } from '../utils/auditHelper.js'

const orderListCache = new Map()
const orderListInflight = new Map()
const ORDER_LIST_TTL_MS = 45 * 1000

function orderListCacheKey(req) {
  const { status, onlyMine, readyPickup, waiterHistory, posQueue } = req.query
  return `${req.user?.id || 0}:${status || ''}:${onlyMine || ''}:${readyPickup || ''}:${waiterHistory || ''}:${posQueue || ''}`
}

export const clearOrderListCache = () => {
  orderListCache.clear()
  orderListInflight.clear()
}

/**
 * 🔥 CREATE ORDER (STAFF)
 */
export const createOrder = async (req, res) => {
  try {
    const {
      tableId,
      addressId,
      type,
      customerName,
      customerPhone,
      notes,
      items,
      discountAmount: discountAmountInput,
      discountType,
      discountValue,
    } = req.body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'items are required'
      })
    }

    // Validation based on type
    /* Relaxed table requirement for POS flexibility */
    if (type === 'delivery' && !addressId) {
      return res.status(400).json({ success: false, message: 'addressId is required for delivery orders' })
    }

    let table = null
    if (tableId) {
      table = await prisma.table.findUnique({
        where: { id: Number(tableId) }
      })

      if (!table) {
        return res.status(404).json({
          success: false,
          message: 'Table not found'
        })
      }
    }

    let subTotal = 0
    let taxAmount = 0
    const orderItemsData = []

    const menuItemIds = [...new Set(items.map((item) => Number(item.menuItemId)))]
    const menuItems = await prisma.menuitem.findMany({
      where: { id: { in: menuItemIds } }
    })
    const menuItemMap = new Map(menuItems.map((menuItem) => [menuItem.id, menuItem]))

    for (const item of items) {
      const menuItem = menuItemMap.get(Number(item.menuItemId))

      if (!menuItem || !menuItem.isAvailable) {
        return res.status(400).json({
          success: false,
          message: 'Menu item not available'
        })
      }

      const quantity = Number(item.quantity) || 1
      const unitPrice = menuItem.price
      const itemTaxRate = menuItem.tax || 0

      const itemSubtotal = quantity * unitPrice
      const itemTaxAmount = itemSubtotal * (itemTaxRate / 100)

      subTotal += itemSubtotal
      taxAmount += itemTaxAmount

      orderItemsData.push({
        menuItemId: menuItem.id,
        quantity,
        unitPrice,
        tax: itemTaxRate
      })
    }

    let customer = null

    if (customerName && customerPhone) {
      customer = await prisma.customer.upsert({
        where: { phone: customerPhone.trim() },
        update: { fullName: customerName.trim() },
        create: {
          fullName: customerName.trim(),
          phone: customerPhone.trim()
        }
      })
    }

    const discountAmount = Math.max(0, Number(discountAmountInput) || 0)
    const parsedDiscountValue = Math.max(0, Number(discountValue) || 0)
    const orderTotal = Math.max(0, subTotal + taxAmount - discountAmount)

    const order = await prisma.order.create({
      data: {
        orderType: type || 'dine-in',
        tableId: tableId ? Number(tableId) : null,
        addressId: addressId ? Number(addressId) : null,
        customerId: customer?.id || null,
        userId: req.user?.id || null,
        customerName,
        customerPhone,
        notes,
        subTotal,
        taxAmount,
        discountAmount,
        discountType: discountAmount > 0 ? (discountType || null) : null,
        discountValue: discountAmount > 0 ? parsedDiscountValue : 0,
        total: orderTotal,
        status: req.body.status || 'pending',
        source: req.body.source || 'pos',
        orderitem: {
          create: orderItemsData
        }
      },
      include: {
        table: true,
        address: true,
        orderitem: { 
          include: { 
            menuitem: {
              select: {
                id: true,
                name: true,
                price: true,
                costPrice: true,
                tax: true,
                categoryId: true,
                isAvailable: true
              }
            } 
          } 
        }
      }
    })

    // Table stays active/inactive only — no separate "occupied" status
    // (orders track table usage; admin sets inactive to disable a table)

    /* 
    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: 'pending'
      }
    })
    */

    if (order.status === 'pending' || order.status === 'paid') {
      await notifyNewOrder(order, req.user?.id)
    }

    await logAudit({ userId: req.user?.id, action: 'Created', entity: 'Order', entityId: order.id, description: `Created order #${order.id} for table ${table?.number || 'N/A'}` })

    clearOrderListCache()

    res.status(201).json({
      success: true,
      data: order
    })

  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

///////////////////////////////////////////////////////////////

/**
 * 🔥 UPDATE ORDER STATUS (FULL + SOCKET)
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const order = await prisma.order.findUnique({
      where: { id: Number(id) },
      include: { table: true, customer: true }
    })

    if (!order) {
      return res.status(404).json({ success: false })
    }

    const userRole = req.user?.role?.toLowerCase()
    if (userRole === 'kitchen') {
      const allowed =
        (order.status === 'pending' && status === 'preparing') ||
        (order.status === 'paid' && status === 'preparing') ||
        (order.status === 'preparing' && status === 'ready')
      if (!allowed) {
        return res.status(400).json({
          success: false,
          message: 'Kitchen can only move pending/paid → preparing or preparing → ready',
        })
      }
    }

    if (userRole === 'waiter') {
      const allowed = order.status === 'ready' && status === 'served'
      if (!allowed) {
        return res.status(400).json({
          success: false,
          message: 'Waiter can only mark ready orders as served',
        })
      }
    }

    if (userRole === 'pos') {
      const channel =
        order.orderType ||
        (order.tableId ? 'dine-in' : order.addressId ? 'delivery' : 'takeaway')
      const allowed =
        order.status === 'ready' &&
        status === 'served' &&
        (channel === 'takeaway' || channel === 'delivery')
      if (!allowed) {
        return res.status(400).json({
          success: false,
          message: 'POS can only complete ready takeaway or delivery orders',
        })
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { status },
      include: {
        table: true,
        customer: true,
        orderitem: { include: { menuitem: true } }
      }
    })

    /*
    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status
      }
    })
    */

    if (status === 'ready') {
      await notifyOrderReady(updatedOrder, req.user?.id)
    }

    // 🔥 TABLE FREE
    if ((status === 'served' || status === 'cancelled') && order.tableId) {
      await prisma.table.update({
        where: { id: order.tableId },
        data: { status: 'active' }
      })
    }

    // 🔥 SOCKET → WAITER/KITCHEN
    emitOrderUpdate(updatedOrder)

    logAudit({ userId: req.user?.id, action: 'Status Changed', entity: 'Order', entityId: updatedOrder.id, description: `Order #${updatedOrder.id} status changed to "${status}"` })

    clearOrderListCache()

    res.status(200).json({
      success: true,
      data: updatedOrder
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * 🔥 UPDATE ORDER DETAILS (ITEMS, TABLE, ETC)
 */
export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params
    const { tableId, addressId, type, customerName, customerPhone, notes, items } = req.body

    const orderId = Number(id)
    if (isNaN(orderId)) {
      return res.status(400).json({ success: false, message: 'Invalid order id' })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'items are required' })
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId }
    })

    if (!existingOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' })
    }

    let total = 0
    const orderItemsData = []

    for (const item of items) {
      const menuItem = await prisma.menuitem.findUnique({
        where: { id: Number(item.menuItemId) }
      })

      if (!menuItem || !menuItem.isAvailable) {
        return res.status(400).json({ success: false, message: 'Menu item not available' })
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

    // Delete old items
    await prisma.orderitem.deleteMany({
      where: { orderId: orderId }
    })

    // Update customer if needed
    let customer = null
    if (customerName && customerPhone) {
      customer = await prisma.customer.upsert({
        where: { phone: customerPhone.trim() },
        update: { fullName: customerName.trim() },
        create: {
          fullName: customerName.trim(),
          phone: customerPhone.trim()
        }
      })
    }

    // Update order and create new items
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        orderType: type || existingOrder.orderType,
        tableId: tableId ? Number(tableId) : existingOrder.tableId,
        addressId: addressId ? Number(addressId) : existingOrder.addressId,
        customerId: customer?.id || existingOrder.customerId,
        customerName: customerName || existingOrder.customerName,
        customerPhone: customerPhone || existingOrder.customerPhone,
        notes: notes || existingOrder.notes,
        total,
        orderitem: {
          create: orderItemsData
        }
      },
      include: orderListInclude,
    })

    emitOrderUpdate(updatedOrder)

    logAudit({ userId: req.user?.id, action: 'Updated', entity: 'Order', entityId: updatedOrder.id, description: `Updated order #${updatedOrder.id}` })

    clearOrderListCache()

    res.status(200).json({
      success: true,
      data: updatedOrder
    })
  } catch (error) {
    console.error('Update Order Error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}


///////////////////////////////////////////////////////////////

const orderUserInclude = {
  user: {
    select: {
      id: true,
      fullName: true,
      role: { select: { id: true, name: true } },
    },
  },
}

const orderListInclude = {
  table: {
    include: {
      room: { select: { id: true, name: true } },
    },
  },
  address: true,
  ...orderUserInclude,
  orderitem: {
    include: {
      menuitem: {
        select: {
          id: true,
          name: true,
          price: true,
          costPrice: true,
          tax: true,
          categoryId: true,
          isAvailable: true,
          imageUrl: true,
          description: true,
        },
      },
    },
  },
}

const orderListLightInclude = {
  table: {
    select: {
      id: true,
      number: true,
      room: { select: { id: true, name: true } },
    },
  },
  address: {
    select: { id: true, street: true, district: true, name: true, phone: true },
  },
  ...orderUserInclude,
  orderitem: {
    include: {
      menuitem: {
        select: { id: true, name: true, price: true, imageUrl: true },
      },
    },
  },
}

/**
 * 🔥 GET ALL ORDERS
 */
export const getAllOrders = async (req, res) => {
  try {
    const cacheKey = orderListCacheKey(req)
    const now = Date.now()
    const cached = orderListCache.get(cacheKey)

    if (cached && now - cached.at < ORDER_LIST_TTL_MS) {
      return res.json({ success: true, data: cached.data })
    }

    const pending = orderListInflight.get(cacheKey)
    if (pending) {
      const orders = await pending
      return res.json({ success: true, data: orders })
    }

    const { status, onlyMine, readyPickup } = req.query
    const isWaiterHistory = req.query.waiterHistory === 'true'

    const where = {}
    if (status) where.status = status

    const userRole = req.user?.role?.toLowerCase()
    let useLightInclude = false
    let takeLimit

    if (userRole === 'waiter' && readyPickup === 'true') {
      where.status = 'ready'
      where.orderType = 'dine-in'
      useLightInclude = true
      takeLimit = 80
    } else if (userRole === 'pos' && req.query.posQueue === 'true') {
      where.orderType = { in: ['takeaway', 'delivery'] }
      where.status = { in: ['pending', 'paid', 'preparing', 'ready'] }
      useLightInclude = true
      takeLimit = 120
    } else if (userRole === 'pos' && readyPickup === 'true') {
      where.status = 'ready'
      where.orderType = { in: ['takeaway', 'delivery'] }
      useLightInclude = true
      takeLimit = 80
    } else if (userRole === 'waiter' && isWaiterHistory) {
      where.userId = req.user.id
      where.status = 'served'
      useLightInclude = true
      takeLimit = 100
    } else {
      const ownOrdersOnly = ['client', 'customer', 'waiter']
      if (ownOrdersOnly.includes(userRole)) {
        where.userId = req.user.id
      } else if (onlyMine === 'true' && req.user?.id) {
        where.userId = req.user.id
      }
    }

    const fetchPromise = prisma.order
      .findMany({
        where,
        include: useLightInclude ? orderListLightInclude : orderListInclude,
        orderBy: { createdAt: 'desc' },
        ...(takeLimit ? { take: takeLimit } : {}),
      })
      .then((orders) => {
        orderListCache.set(cacheKey, { data: orders, at: Date.now() })
        orderListInflight.delete(cacheKey)
        return orders
      })
      .catch((err) => {
        orderListInflight.delete(cacheKey)
        throw err
      })

    orderListInflight.set(cacheKey, fetchPromise)
    const orders = await fetchPromise

    res.json({ success: true, data: orders })
  } catch (error) {
    console.error('Get All Orders Error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * 🔥 GET ORDER BY ID
 */
export const getOrderById = async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: Number(req.params.id) },
    include: orderListInclude,
  })

  if (!order) return res.status(404).json({ success: false })

  res.json({ success: true, data: order })
}

/**
 * 🔥 DELETE ORDER
 */
export const deleteOrder = async (req, res) => {
  const id = Number(req.params.id)

  await prisma.orderitem.deleteMany({ where: { orderId: id } })
  await prisma.order.delete({ where: { id } })

  logAudit({ userId: req.user?.id, action: 'Deleted', entity: 'Order', entityId: id, description: `Deleted order #${id}` })

  clearOrderListCache()

  res.json({ success: true })
}

export const getOrdersByTable = async (req, res) => {
  try {
    const { tableId } = req.params

    const id = Number(tableId)

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid table id'
      })
    }

    const orders = await prisma.order.findMany({
      where: { tableId: id },
      include: {
        table: true,
        customer: true,
        orderitem: {
          include: { 
            menuitem: {
              select: {
                id: true,
                name: true,
                price: true,
                costPrice: true,
                tax: true,
                categoryId: true,
                isAvailable: true,
                imageUrl: true,
                description: true,
              }
            } 
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({
      success: true,
      data: orders
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}