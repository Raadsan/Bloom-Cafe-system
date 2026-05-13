// import prisma from '../config/db.js'

// const generateInternalRef = () => {
//   const random = Math.floor(1000 + Math.random() * 9000)
//   return `PAY-${Date.now()}-${random}`
// }

// // PUBLIC: CREATE PAYMENT REQUEST
// export const createPublicPayment = async (req, res) => {
//   try {
//     let { orderId, method, phone, providerName } = req.body

//     if (!orderId || !method) {
//       return res.status(400).json({
//         success: false,
//         message: 'orderId and method are required'
//       })
//     }

//     const parsedOrderId = Number(orderId)

//     if (isNaN(parsedOrderId)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid order id'
//       })
//     }

//     method = method.trim().toLowerCase()
//     phone = phone?.trim() || null
//     providerName = providerName?.trim() || method

//     const order = await prisma.order.findUnique({
//       where: { id: parsedOrderId },
//       include: {
//         payment: true,
//         table: true,
//         customer: true
//       }
//     })

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: 'Order not found'
//       })
//     }

//     if (order.payment) {
//       return res.status(409).json({
//         success: false,
//         message: 'Payment already exists for this order'
//       })
//     }

//     const payment = await prisma.payment.create({
//       data: {
//         orderId: parsedOrderId,
//         amount: order.total,
//         method,
//         status: 'pending',
//         internalRef: generateInternalRef(),
//         providerName,
//         phone
//       },
//       include: {
//         order: {
//           include: {
//             table: true,
//             customer: true
//           }
//         }
//       }
//     })

//     return res.status(201).json({
//       success: true,
//       message: 'Payment request created successfully',
//       data: payment
//     })
//   } catch (error) {
//     console.error('Create Public Payment Error:', error)
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to create payment request',
//       error: error.message
//     })
//   }
// }

// // PUBLIC: CONFIRM PAYMENT
// export const confirmPublicPayment = async (req, res) => {
//   try {
//     const { id } = req.params
//     let { providerRef, status } = req.body

//     const paymentId = Number(id)

//     if (isNaN(paymentId)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid payment id'
//       })
//     }

//     status = status?.trim().toLowerCase() || 'paid'
//     providerRef = providerRef?.trim() || null

//     if (!['paid', 'failed'].includes(status)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid status. Allowed: paid, failed'
//       })
//     }

//     const existingPayment = await prisma.payment.findUnique({
//       where: { id: paymentId },
//       include: {
//         order: {
//           include: {
//             table: true,
//             customer: true
//           }
//         }
//       }
//     })

//     if (!existingPayment) {
//       return res.status(404).json({
//         success: false,
//         message: 'Payment not found'
//       })
//     }

//     if (existingPayment.status === 'paid') {
//       return res.status(400).json({
//         success: false,
//         message: 'Payment already confirmed'
//       })
//     }

//     const updatedPayment = await prisma.payment.update({
//       where: { id: paymentId },
//       data: {
//         status,
//         providerRef: providerRef || existingPayment.providerRef,
//         paidAt: status === 'paid' ? new Date() : existingPayment.paidAt
//       },
//       include: {
//         order: {
//           include: {
//             table: true,
//             customer: true
//           }
//         }
//       }
//     })

//     if (status === 'paid') {
//       await prisma.notification.createMany({
//         data: [
//           {
//             title: 'New Paid Order',
//             message: `Table ${updatedPayment.order.table.number} placed a paid order`,
//             role: 'kitchen',
//             orderId: updatedPayment.order.id
//           },
//           {
//             title: 'Payment Confirmed',
//             message: `Order paid for Table ${updatedPayment.order.table.number}`,
//             role: 'admin',
//             orderId: updatedPayment.order.id
//           },
//           {
//             title: 'Payment Confirmed',
//             message: `Order paid for Table ${updatedPayment.order.table.number}`,
//             role: 'manager',
//             orderId: updatedPayment.order.id
//           },
//           {
//             title: 'Payment Successful',
//             message: 'Your payment was successful',
//             role: 'customer',
//             orderId: updatedPayment.order.id,
//             customerId: updatedPayment.order.customerId
//           }
//         ]
//       })
//     }

//     if (status === 'failed') {
//       await prisma.notification.createMany({
//         data: [
//           {
//             title: 'Payment Failed',
//             message: `Payment failed for Table ${updatedPayment.order.table.number}`,
//             role: 'admin',
//             orderId: updatedPayment.order.id
//           },
//           {
//             title: 'Payment Failed',
//             message: `Payment failed for Table ${updatedPayment.order.table.number}`,
//             role: 'manager',
//             orderId: updatedPayment.order.id
//           },
//           {
//             title: 'Payment Failed',
//             message: 'Your payment failed',
//             role: 'customer',
//             orderId: updatedPayment.order.id,
//             customerId: updatedPayment.order.customerId
//           }
//         ]
//       })
//     }

//     return res.status(200).json({
//       success: true,
//       message: `Payment ${status} successfully`,
//       data: updatedPayment
//     })
//   } catch (error) {
//     console.error('Confirm Public Payment Error:', error)
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to confirm payment',
//       error: error.message
//     })
//   }
// }

// // STAFF: CREATE DIRECT PAYMENT
// export const createPayment = async (req, res) => {
//   try {
//     let { orderId, method, providerRef, providerName, phone } = req.body

//     if (!orderId || !method) {
//       return res.status(400).json({
//         success: false,
//         message: 'orderId and method are required'
//       })
//     }

//     const parsedOrderId = Number(orderId)

//     if (isNaN(parsedOrderId)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid order id'
//       })
//     }

//     method = method.trim().toLowerCase()
//     providerRef = providerRef?.trim() || null
//     providerName = providerName?.trim() || method
//     phone = phone?.trim() || null

//     const order = await prisma.order.findUnique({
//       where: { id: parsedOrderId },
//       include: {
//         payment: true,
//         table: true,
//         customer: true
//       }
//     })

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: 'Order not found'
//       })
//     }

//     if (order.payment) {
//       return res.status(409).json({
//         success: false,
//         message: 'Payment already exists for this order'
//       })
//     }

//     const payment = await prisma.payment.create({
//       data: {
//         orderId: parsedOrderId,
//         amount: order.total,
//         method,
//         status: 'paid',
//         internalRef: generateInternalRef(),
//         providerRef,
//         providerName,
//         phone,
//         paidAt: new Date()
//       },
//       include: {
//         order: {
//           include: {
//             table: true,
//             customer: true
//           }
//         }
//       }
//     })

//     await prisma.notification.createMany({
//       data: [
//         {
//           title: 'New Paid Order',
//           message: `Table ${payment.order.table.number} has a paid order`,
//           role: 'kitchen',
//           orderId: payment.order.id
//         },
//         {
//           title: 'Payment Confirmed',
//           message: `Order paid for Table ${payment.order.table.number}`,
//           role: 'admin',
//           orderId: payment.order.id
//         },
//         {
//           title: 'Payment Confirmed',
//           message: `Order paid for Table ${payment.order.table.number}`,
//           role: 'manager',
//           orderId: payment.order.id
//         }
//       ]
//     })

//     return res.status(201).json({
//       success: true,
//       message: 'Payment created successfully',
//       data: payment
//     })
//   } catch (error) {
//     console.error('Create Payment Error:', error)
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to create payment',
//       error: error.message
//     })
//   }
// }

// // GET ALL PAYMENTS
// export const getAllPayments = async (req, res) => {
//   try {
//     const payments = await prisma.payment.findMany({
//       include: {
//         order: {
//           include: {
//             table: true,
//             customer: true
//           }
//         }
//       },
//       orderBy: {
//         createdAt: 'desc'
//       }
//     })

//     return res.status(200).json({
//       success: true,
//       count: payments.length,
//       data: payments
//     })
//   } catch (error) {
//     console.error('Get Payments Error:', error)
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to fetch payments',
//       error: error.message
//     })
//   }
// }

// // GET PAYMENT BY ID
// export const getPaymentById = async (req, res) => {
//   try {
//     const { id } = req.params
//     const paymentId = Number(id)

//     if (isNaN(paymentId)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid payment id'
//       })
//     }

//     const payment = await prisma.payment.findUnique({
//       where: { id: paymentId },
//       include: {
//         order: {
//           include: {
//             table: true,
//             customer: true,
//             items: {
//               include: {
//                 menuItem: true
//               }
//             }
//           }
//         }
//       }
//     })

//     if (!payment) {
//       return res.status(404).json({
//         success: false,
//         message: 'Payment not found'
//       })
//     }

//     return res.status(200).json({
//       success: true,
//       data: payment
//     })
//   } catch (error) {
//     console.error('Get Payment By Id Error:', error)
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to fetch payment',
//       error: error.message
//     })
//   }
// }

// // GET PAYMENT BY ORDER ID
// export const getPaymentByOrderId = async (req, res) => {
//   try {
//     const { orderId } = req.params
//     const parsedOrderId = Number(orderId)

//     if (isNaN(parsedOrderId)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid order id'
//       })
//     }

//     const payment = await prisma.payment.findUnique({
//       where: { orderId: parsedOrderId },
//       include: {
//         order: {
//           include: {
//             table: true,
//             customer: true,
//             items: {
//               include: {
//                 menuItem: true
//               }
//             }
//           }
//         }
//       }
//     })

//     if (!payment) {
//       return res.status(404).json({
//         success: false,
//         message: 'Payment not found for this order'
//       })
//     }

//     return res.status(200).json({
//       success: true,
//       data: payment
//     })
//   } catch (error) {
//     console.error('Get Payment By Order Id Error:', error)
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to fetch payment by order',
//       error: error.message
//     })
//   }
// }

// // UPDATE PAYMENT STATUS
// export const updatePaymentStatus = async (req, res) => {
//   try {
//     const { id } = req.params
//     let { status, providerRef } = req.body

//     const paymentId = Number(id)

//     if (isNaN(paymentId)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid payment id'
//       })
//     }

//     status = status?.trim().toLowerCase()
//     providerRef = providerRef?.trim() || null

//     const allowedStatuses = ['pending', 'paid', 'failed', 'refunded']

//     if (!status || !allowedStatuses.includes(status)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid status. Allowed: pending, paid, failed, refunded'
//       })
//     }

//     const existingPayment = await prisma.payment.findUnique({
//       where: { id: paymentId }
//     })

//     if (!existingPayment) {
//       return res.status(404).json({
//         success: false,
//         message: 'Payment not found'
//       })
//     }

//     const updatedPayment = await prisma.payment.update({
//       where: { id: paymentId },
//       data: {
//         status,
//         providerRef: providerRef || existingPayment.providerRef,
//         paidAt: status === 'paid' ? new Date() : existingPayment.paidAt
//       }
//     })

//     return res.status(200).json({
//       success: true,
//       message: 'Payment status updated successfully',
//       data: updatedPayment
//     })
//   } catch (error) {
//     console.error('Update Payment Status Error:', error)
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to update payment status',
//       error: error.message
//     })
//   }
// }

// // DELETE PAYMENT
// export const deletePayment = async (req, res) => {
//   try {
//     const { id } = req.params
//     const paymentId = Number(id)

//     if (isNaN(paymentId)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid payment id'
//       })
//     }

//     const existingPayment = await prisma.payment.findUnique({
//       where: { id: paymentId }
//     })

//     if (!existingPayment) {
//       return res.status(404).json({
//         success: false,
//         message: 'Payment not found'
//       })
//     }

//     await prisma.payment.delete({
//       where: { id: paymentId }
//     })

//     return res.status(200).json({
//       success: true,
//       message: 'Payment deleted successfully'
//     })
//   } catch (error) {
//     console.error('Delete Payment Error:', error)
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to delete payment',
//       error: error.message
//     })
//   }
// }

// export const createPrepaidOrder = async (req, res) => {
//   try {
//     const { cartId, paymentMethod } = req.body

//     // 1. GET CART
//     const cart = await prisma.cart.findUnique({
//       where: { id: Number(cartId) },
//       include: {
//         items: {
//           include: { menuItem: true }
//         }
//       }
//     })

//     if (!cart || cart.items.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'Cart is empty'
//       })
//     }

//     // 2. CALCULATE TOTAL
//     let total = 0

//     cart.items.forEach(item => {
//       total += item.quantity * item.menuItem.price
//     })

//     // 3. CREATE PAYMENT (PENDING)
//     const payment = await prisma.payment.create({
//       data: {
//         amount: total,
//         method: paymentMethod || 'EVC',
//         status: 'pending'
//       }
//     })

//     // ⚠️ HERE YOU WILL INTEGRATE EVC / EDAHAB LATER

//     // 4. SIMULATE PAYMENT SUCCESS
//     const paymentSuccess = true

//     if (!paymentSuccess) {
//       return res.status(400).json({
//         success: false,
//         message: 'Payment failed'
//       })
//     }

//     // 5. UPDATE PAYMENT → SUCCESS
//     await prisma.payment.update({
//       where: { id: payment.id },
//       data: { status: 'paid' }
//     })

//     // 6. CREATE ORDER (AFTER PAYMENT)
//     const orderItems = cart.items.map(item => ({
//       menuItemId: item.menuItemId,
//       quantity: item.quantity,
//       unitPrice: item.menuItem.price
//     }))

//     const order = await prisma.order.create({
//       data: {
//         tableId: cart.tableId,
//         total,
//         status: 'pending',
//         paymentId: payment.id,
//         items: {
//           create: orderItems
//         }
//       }
//     })

//     // 7. CLEAR CART
//     await prisma.cartItem.deleteMany({
//       where: { cartId: cart.id }
//     })

//     await prisma.cart.update({
//       where: { id: cart.id },
//       data: { status: 'completed' }
//     })

//     res.status(200).json({
//       success: true,
//       message: 'Payment successful & order created',
//       data: { payment, order }
//     })

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     })
//   }
// }










import prisma from '../config/db.js'
import { emitNewOrder, emitPaymentSuccess } from '../utils/socketEvents.js'

// GET AVAILABLE PAYMENT METHODS
export const getPaymentMethods = async (req, res) => {
  try {
    // You can also fetch this from DB if you create a model
    // For now, let's return the standard ones as per the user's screenshot
    const methods = [
      { id: 'evc_plus', name: 'EVC Plus', icon: 'E', color: '#FFEBEE', textColor: '#D32F2F' },
      { id: 'edahab', name: 'eDahab', icon: 'e', color: '#F1F8E9', textColor: '#388E3C' },
      { id: 'zaad', name: 'ZAAD', icon: 'Z', color: '#E8EAF6', textColor: '#303F9F' },
      { id: 'waafi', name: 'WAAFI', icon: 'W', color: '#E8EAF6', textColor: '#3F51B5' },
      { id: 'sahal', name: 'SAHAL', icon: 'S', color: '#E0F2F1', textColor: '#00796B' },
    ]

    res.status(200).json({
      success: true,
      data: methods
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

const generateInternalRef = () => {
  const random = Math.floor(1000 + Math.random() * 9000)
  return `PAY-${Date.now()}-${random}`
}


//  CREATE PAYMENT REQUEST (PUBLIC / QR)
export const createPublicPayment = async (req, res) => {
  try {
    let { orderId, method, phone, providerName } = req.body

    if (!orderId || !method) {
      return res.status(400).json({
        success: false,
        message: 'orderId and method are required'
      })
    }

    const parsedOrderId = Number(orderId)

    const order = await prisma.order.findUnique({
      where: { id: parsedOrderId },
      include: { payment: true, table: true, customer: true }
    })

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' })
    }

    if (order.payment) {
      return res.status(409).json({ success: false, message: 'Payment already exists' })
    }

    const payment = await prisma.payment.create({
      data: {
        orderId: parsedOrderId,
        amount: order.total,
        method: method.toLowerCase(),
        status: 'pending',
        internalRef: generateInternalRef(),
        providerName: providerName || method,
        phone
      },
      include: {
        order: { include: { table: true, customer: true } }
      }
    })

    res.status(201).json({ success: true, data: payment })

  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

//  CONFIRM PAYMENT (PUBLIC)
export const confirmPublicPayment = async (req, res) => {
  try {
    const paymentId = Number(req.params.id)
    let { status, providerRef } = req.body

    status = status?.toLowerCase() || 'paid'

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: {
          include: { table: true, customer: true, orderitem: true }
        }
      }
    })

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' })
    }

    if (payment.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Already paid' })
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status,
        providerRef,
        paidAt: status === 'paid' ? new Date() : null
      },
      include: {
        order: { include: { table: true, customer: true } }
      }
    })

    if (status === 'paid') {

      // 🔥 UPDATE TABLE
      await prisma.table.update({
        where: { id: payment.order.tableId },
        data: { status: 'inactive' }
      })

      // 🔥 NOTIFICATIONS
      await prisma.notification.createMany({
        data: [
          {
            title: 'New Paid Order',
            message: `Table ${payment.order.table.number} paid`,
            role: 'kitchen',
            orderId: payment.order.id
          },
          {
            title: 'Payment Successful',
            message: 'Your payment was successful',
            role: 'customer',
            orderId: payment.order.id,
            customerId: payment.order.customerId
          }
        ]
      })

      // 🔥 SOCKET
      emitNewOrder(payment.order)
      emitPaymentSuccess(payment.order)
    }

    res.json({ success: true, data: updatedPayment })

  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}


//  STAFF PAYMENT (CASH / POS)
export const createPayment = async (req, res) => {
  try {
    const { orderId, method } = req.body

    const order = await prisma.order.findUnique({
      where: { id: Number(orderId) },
      include: { payment: true, table: true }
    })

    if (!order) return res.status(404).json({ success: false })

    if (order.payment) {
      return res.status(409).json({ success: false, message: 'Already paid' })
    }

    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: order.total,
        method: method || 'cash',
        status: 'paid',
        internalRef: generateInternalRef(),
        paidAt: new Date()
      },
      include: { order: { include: { table: true } } }
    })

    // 🔥 UPDATE TABLE
    await prisma.table.update({
      where: { id: order.tableId },
      data: { status: 'inactive' }
    })

    // 🔥 SOCKET
    emitNewOrder(payment.order)
    emitPaymentSuccess(payment.order)

    res.json({ success: true, data: payment })

  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

//  GET ALL PAYMENTS  
export const getAllPayments = async (req, res) => {
  const payments = await prisma.payment.findMany({
    include: {
      order: { include: { table: true, customer: true } }
    },
    orderBy: { createdAt: 'desc' }
  })

  res.json({ success: true, data: payments })
}

//  GET PAYMENT BY ID
export const getPaymentById = async (req, res) => {
  const payment = await prisma.payment.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      order: {
        include: {
          table: true,
          customer: true,
          orderitem: { include: { menuitem: true } }
        }
      }
    }
  })

  if (!payment) {
    return res.status(404).json({ success: false })
  }

  res.json({ success: true, data: payment })
}


//  GET PAYMENT BY ORDER ID
export const getPaymentByOrderId = async (req, res) => {
  const payment = await prisma.payment.findUnique({
    where: { orderId: Number(req.params.orderId) },
    include: {
      order: {
        include: {
          table: true,
          customer: true,
          orderitem: { include: { menuitem: true } }
        }
      }
    }
  })

  if (!payment) {
    return res.status(404).json({ success: false })
  }

  res.json({ success: true, data: payment })
}

//  UPDATE PAYMENT STATUS (ADMIN)
export const updatePaymentStatus = async (req, res) => {
  try {
    const payment = await prisma.payment.update({
      where: { id: Number(req.params.id) },
      data: {
        status: req.body.status,
        paidAt: req.body.status === 'paid' ? new Date() : null
      }
    })

    res.json({ success: true, data: payment })

  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

//  DELETE PAYMENT
export const deletePayment = async (req, res) => {
  await prisma.payment.delete({
    where: { id: Number(req.params.id) }
  })

  res.json({ success: true })
}