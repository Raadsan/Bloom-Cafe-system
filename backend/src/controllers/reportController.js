import prisma from '../config/db.js'

// 🔹 DATE RANGE
const parseDateRange = (query) => {
  const { startDate, endDate } = query

  if (!startDate && !endDate) return null

  const range = {}

  if (startDate) {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    range.gte = start
  }

  if (endDate) {
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)
    range.lte = end
  }

  return range
}

// 🔹 MOVE OUTSIDE (VERY IMPORTANT)
const getStartOfDay = () => {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

const getEndOfDay = () => {
  const date = new Date()
  date.setHours(23, 59, 59, 999)
  return date
}

const getStartOfMonth = () => {
  const date = new Date()
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0)
}

const getEndOfMonth = () => {
  const date = new Date()
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

// DASHBOARD SUMMARY
export const getDashboardSummary = async (req, res) => {
  try {
    const dateRange = parseDateRange(req.query)

    const orderWhere = dateRange
      ? { createdAt: dateRange }
      : {}

    const paidPaymentWhere = {
      status: 'paid',
      ...(dateRange ? { paidAt: dateRange } : {})
    }

    const [totalOrders, totalCustomers, totalTables, totalRevenueResult, paidPayments, pendingPayments] =
      await Promise.all([
        prisma.order.count({ where: orderWhere }),
        prisma.customer.count(),
        prisma.table.count(),
        prisma.payment.aggregate({
          where: paidPaymentWhere,
          _sum: {
            amount: true
          }
        }),
        prisma.payment.count({
          where: {
            status: 'paid',
            ...(dateRange ? { paidAt: dateRange } : {})
          }
        }),
        prisma.payment.count({
          where: {
            status: 'pending',
            ...(dateRange ? { createdAt: dateRange } : {})
          }
        })
      ])

    return res.status(200).json({
      success: true,
      data: {
        totalOrders,
        totalCustomers,
        totalTables,
        totalPaidPayments: paidPayments,
        totalPendingPayments: pendingPayments,
        totalRevenue: totalRevenueResult._sum.amount || 0
      }
    })
  } catch (error) {
    console.error('Get Dashboard Summary Error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard summary',
      error: error.message
    })
  }
}

// REVENUE REPORT
export const getRevenueReport = async (req, res) => {
  try {
    const dateRange = parseDateRange(req.query)

    const payments = await prisma.payment.findMany({
      where: {
        status: 'paid',
        ...(dateRange ? { paidAt: dateRange } : {})
      },
      orderBy: {
        paidAt: 'desc'
      },
      include: {
        order: {
          include: {
            table: true,
            customer: true
          }
        }
      }
    })

    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0)

    const revenueByMethodMap = {}

    for (const payment of payments) {
      const key = payment.method || 'unknown'

      if (!revenueByMethodMap[key]) {
        revenueByMethodMap[key] = {
          method: key,
          totalAmount: 0,
          count: 0
        }
      }

      revenueByMethodMap[key].totalAmount += payment.amount
      revenueByMethodMap[key].count += 1
    }

    return res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        totalPaidTransactions: payments.length,
        revenueByMethod: Object.values(revenueByMethodMap),
        payments
      }
    })
  } catch (error) {
    console.error('Get Revenue Report Error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue report',
      error: error.message
    })
  }
}

// BEST SELLING ITEMS
export const getTopSellingItems = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10
    const dateRange = parseDateRange(req.query)

    const groupedItems = await prisma.orderitem.groupBy({
      by: ['menuItemId'],
      _sum: {
        quantity: true,
        unitPrice: true
      },
      where: dateRange
        ? {
            order: {
              createdAt: dateRange
            }
          }
        : {},
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: limit
    })

    const menuItemIds = groupedItems.map(item => item.menuItemId)

    const menuItems = await prisma.menuitem.findMany({
      where: {
        id: {
          in: menuItemIds
        }
      },
      include: {
        category: true
      }
    })

    const result = groupedItems.map(item => {
      const menuItem = menuItems.find(menu => menu.id === item.menuItemId)

      return {
        menuItemId: item.menuItemId,
        name: menuItem?.name || 'Unknown Item',
        category: menuItem?.category?.name || null,
        totalQuantitySold: item._sum.quantity || 0
      }
    })

    return res.status(200).json({
      success: true,
      count: result.length,
      data: result
    })
  } catch (error) {
    console.error('Get Top Selling Items Error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch top selling items',
      error: error.message
    })
  }
}

// TABLE PERFORMANCE REPORT
export const getTablePerformanceReport = async (req, res) => {
  try {
    const dateRange = parseDateRange(req.query)

    const groupedOrders = await prisma.order.groupBy({
      by: ['tableId'],
      _count: {
        id: true
      },
      _sum: {
        total: true
      },
      where: dateRange
        ? {
            createdAt: dateRange
          }
        : {},
      orderBy: {
        _sum: {
          total: 'desc'
        }
      }
    })

    const tableIds = groupedOrders.map(item => item.tableId)

    const tables = await prisma.table.findMany({
      where: {
        id: {
          in: tableIds
        }
      }
    })

    const result = groupedOrders.map(item => {
      const table = tables.find(t => t.id === item.tableId)

      return {
        tableId: item.tableId,
        tableNumber: table?.number || null,
        tableName: table?.name || null,
        totalOrders: item._count.id || 0,
        totalRevenue: item._sum.total || 0
      }
    })

    return res.status(200).json({
      success: true,
      count: result.length,
      data: result
    })
  } catch (error) {
    console.error('Get Table Performance Report Error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch table performance report',
      error: error.message
    })
  }
}

// DAILY REPORT
export const getDailyReport = async (req, res) => {
  try {
    const start = getStartOfDay()
    const end = getEndOfDay()

    const [ordersCount, payments, topItems] = await Promise.all([
      prisma.order.count({
        where: {
          createdAt: {
            gte: start,
            lte: end
          }
        }
      }),
      prisma.payment.findMany({
        where: {
          status: 'paid',
          paidAt: {
            gte: start,
            lte: end
          }
        },
        include: {
          order: {
            include: {
              table: true,
              customer: true
            }
          }
        }
      }),
      prisma.orderItem.groupBy({
        by: ['menuItemId'],
        _sum: {
          quantity: true
        },
        where: {
          order: {
            createdAt: {
              gte: start,
              lte: end
            }
          }
        },
        orderBy: {
          _sum: {
            quantity: 'desc'
          }
        },
        take: 5
      })
    ])

    const revenue = payments.reduce((sum, item) => sum + item.amount, 0)

    return res.status(200).json({
      success: true,
      data: {
        reportType: 'daily',
        date: start,
        totalOrders: ordersCount,
        totalRevenue: revenue,
        totalPaidPayments: payments.length,
        topItems
      }
    })
  } catch (error) {
    console.error('Get Daily Report Error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch daily report',
      error: error.message
    })
  }
}

// MONTHLY REPORT
export const getMonthlyReport = async (req, res) => {
  try {
    const start = getStartOfMonth()
    const end = getEndOfMonth()

    const [ordersCount, payments, topItems] = await Promise.all([
      prisma.order.count({
        where: {
          createdAt: {
            gte: start,
            lte: end
          }
        }
      }),
      prisma.payment.findMany({
        where: {
          status: 'paid',
          paidAt: {
            gte: start,
            lte: end
          }
        },
        include: {
          order: {
            include: {
              table: true,
              customer: true
            }
          }
        }
      }),
      prisma.orderItem.groupBy({
        by: ['menuItemId'],
        _sum: {
          quantity: true
        },
        where: {
          order: {
            createdAt: {
              gte: start,
              lte: end
            }
          }
        },
        orderBy: {
          _sum: {
            quantity: 'desc'
          }
        },
        take: 10
      })
    ])

    const revenue = payments.reduce((sum, item) => sum + item.amount, 0)

    return res.status(200).json({
      success: true,
      data: {
        reportType: 'monthly',
        month: start.getMonth() + 1,
        year: start.getFullYear(),
        totalOrders: ordersCount,
        totalRevenue: revenue,
        totalPaidPayments: payments.length,
        topItems
      }
    })
  } catch (error) {
    console.error('Get Monthly Report Error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch monthly report',
      error: error.message
    })
  }
}

// STAFF PERFORMANCE REPORT
export const getStaffPerformanceReport = async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        userId: {
          not: null
        }
      },
      include: {
        user: {
          include: {
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const performanceMap = {}

    for (const log of logs) {
      if (!log.user) continue

      const key = log.user.id

      if (!performanceMap[key]) {
        performanceMap[key] = {
          userId: log.user.id,
          fullName: log.user.fullName,
          email: log.user.email,
          role: log.user.role?.name || null,
          totalActions: 0,
          actions: {}
        }
      }

      performanceMap[key].totalActions += 1

      if (!performanceMap[key].actions[log.action]) {
        performanceMap[key].actions[log.action] = 0
      }

      performanceMap[key].actions[log.action] += 1
    }

    return res.status(200).json({
      success: true,
      count: Object.keys(performanceMap).length,
      data: Object.values(performanceMap)
    })
  } catch (error) {
    console.error('Get Staff Performance Report Error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch staff performance report',
      error: error.message
    })
  }
}