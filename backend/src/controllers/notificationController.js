import prisma from "../config/db.js"

// GET MY NOTIFICATIONS BY LOGGED IN USER ROLE
export const getAllNotifications = async (req, res) => {
  try {
    const userRole = req.user.role

    const notifications = await prisma.notification.findMany({
      where: {
        role: userRole
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications
    })
  } catch (error) {
    console.error("Get Notifications Error:", error)

    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message
    })
  }
}

// KITCHEN STAFF → GET KITCHEN NOTIFICATIONS
export const getKitchenNotifications = async (req, res) => {

  try {

    const notifications = await prisma.notification.findMany({
      where: {
        role: "kitchen"
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications
    })

  } catch (error) {

    console.error("Kitchen Notification Error:", error)

    res.status(500).json({
      success: false,
      message: "Failed to fetch kitchen notifications",
      error: error.message
    })

  }

}

// WAITER → GET WAITER NOTIFICATIONS
export const getWaiterNotifications = async (req, res) => {

  try {

    const notifications = await prisma.notification.findMany({
      where: {
        role: "waiter"
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications
    })

  } catch (error) {

    console.error("Waiter Notification Error:", error)

    res.status(500).json({
      success: false,
      message: "Failed to fetch waiter notifications",
      error: error.message
    })

  }

}

// MARK NOTIFICATION AS READ
export const markNotificationRead = async (req, res) => {

  try {

    const { id } = req.params

    const notification = await prisma.notification.update({
      where: {
        id: Number(id)
      },
      data: {
        isRead: true
      }
    })

    res.status(200).json({
      success: true,
      data: notification
    })

  } catch (error) {

    console.error("Mark Notification Error:", error)

    res.status(500).json({
      success: false,
      message: error.message
    })

  }

}


// ADMIN / MANAGER / KITCHEN / WAITER MY NOTIFICATIONS
export const getMyNotifications = async (req, res) => {
  try {
    const role = req.user.role

    const notifications = await prisma.notification.findMany({
      where: {
        role: role
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications
    })
  } catch (error) {
    console.error("Get My Notifications Error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message
    })
  }
}

// CUSTOMER NOTIFICATIONS BY CUSTOMER ID
export const getCustomerNotifications = async (req, res) => {
  try {
    const { customerId } = req.params
    const id = Number(customerId)

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer id"
      })
    }

    const customer = await prisma.customer.findUnique({
      where: { id }
    })

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      })
    }

    const notifications = await prisma.notification.findMany({
      where: {
        customerId: id
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    res.status(200).json({
      success: true,
      count: notifications.length,
      customer: {
        id: customer.id,
        fullName: customer.fullName,
        phone: customer.phone
      },
      data: notifications
    })
  } catch (error) {
    console.error("Get Customer Notifications Error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch customer notifications",
      error: error.message
    })
  }
}

// CUSTOMER NOTIFICATIONS BY ORDER ID
export const getCustomerNotificationsByOrder = async (req, res) => {
  try {
    const { orderId } = req.params
    const id = Number(orderId)

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order id"
      })
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        table: true
      }
    })

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      })
    }

    const notifications = await prisma.notification.findMany({
      where: {
        orderId: id,
        role: "customer"
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    res.status(200).json({
      success: true,
      count: notifications.length,
      order: {
        id: order.id,
        status: order.status,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        tableNumber: order.table?.number || null
      },
      data: notifications
    })
  } catch (error) {
    console.error("Get Customer Notifications By Order Error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch order notifications",
      error: error.message
    })
  }
}

// // MARK ONE NOTIFICATION AS READ
// export const markNotificationRead = async (req, res) => {
//   try {
//     const { id } = req.params
//     const notificationId = Number(id)

//     if (isNaN(notificationId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid notification id"
//       })
//     }

//     const notification = await prisma.notification.findUnique({
//       where: { id: notificationId }
//     })

//     if (!notification) {
//       return res.status(404).json({
//         success: false,
//         message: "Notification not found"
//       })
//     }

//     const updatedNotification = await prisma.notification.update({
//       where: { id: notificationId },
//       data: {
//         isRead: true
//       }
//     })

//     res.status(200).json({
//       success: true,
//       message: "Notification marked as read",
//       data: updatedNotification
//     })
//   } catch (error) {
//     console.error("Mark Notification Read Error:", error)
//     res.status(500).json({
//       success: false,
//       message: "Failed to mark notification as read",
//       error: error.message
//     })
//   }
// }

// MARK ALL CUSTOMER NOTIFICATIONS AS READ
export const markAllCustomerNotificationsRead = async (req, res) => {
  try {
    const { customerId } = req.params
    const id = Number(customerId)

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer id"
      })
    }

    await prisma.notification.updateMany({
      where: {
        customerId: id,
        role: "customer",
        isRead: false
      },
      data: {
        isRead: true
      }
    })

    res.status(200).json({
      success: true,
      message: "All customer notifications marked as read"
    })
  } catch (error) {
    console.error("Mark All Customer Notifications Read Error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to mark all customer notifications as read",
      error: error.message
    })
  }
}

// GET CUSTOMER UNREAD COUNT
export const getCustomerUnreadCount = async (req, res) => {
  try {
    const { customerId } = req.params
    const id = Number(customerId)

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer id"
      })
    }

    const unread = await prisma.notification.count({
      where: {
        customerId: id,
        role: "customer",
        isRead: false
      }
    })

    res.status(200).json({
      success: true,
      unread
    })
  } catch (error) {
    console.error("Customer Unread Count Error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch unread count",
      error: error.message
    })
  }
}