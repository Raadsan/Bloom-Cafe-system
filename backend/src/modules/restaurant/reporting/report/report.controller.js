import prisma from '../../../../config/db.js'
import { createResponseCache } from '../../../../utils/responseCache.js'
import { addDays, businessDateKey, dateFromKey } from '../../../../utils/businessDay.js'

const reportCache = createResponseCache(90 * 1000)
const WEEKLY_TTL_MS = 2 * 60 * 1000
const completedSaleStatuses = ['served', 'completed', 'paid']

function reportCacheKey(prefix, query = {}) {
  const parts = [prefix]
  for (const key of Object.keys(query).sort()) {
    if (query[key] != null && query[key] !== '') parts.push(`${key}=${query[key]}`)
  }
  return parts.join(':')
}

export const clearReportCache = () => {
  reportCache.clear()
}

async function fetchDashboardSummaryData(query) {
  const dateRange = parseDateRange(query)

  const orderWhere = {
    ...(dateRange ? { businessDate: dateRange } : {}),
    status: { in: completedSaleStatuses },
  }

  const [
    orderStats,
    totalCustomers,
    totalTables,
    paidPaymentsAgg,
    paidPaymentsCount,
    pendingOrdersCount,
    cancelledOrdersCount,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: orderWhere,
      _count: { id: true },
      _sum: { total: true, subTotal: true, taxAmount: true, discountAmount: true },
    }),
    prisma.customers.count(),
    prisma.table.count(),
    prisma.payment.aggregate({
      where: {
        status: 'paid',
        ...(dateRange ? { order: { businessDate: dateRange } } : {}),
      },
      _sum: { amount: true },
    }),
    prisma.payment.count({
      where: {
        status: 'paid',
        ...(dateRange ? { order: { businessDate: dateRange } } : {}),
      },
    }),
    prisma.order.count({
      where: {
        ...(dateRange ? { businessDate: dateRange } : {}),
        status: { in: ['pending', 'preparing', 'held'] },
      },
    }),
    prisma.order.count({
      where: {
        ...(dateRange ? { businessDate: dateRange } : {}),
        status: 'cancelled',
      },
    }),
  ])

  const totalOrders = orderStats._count.id || 0
  const totalRevenue = Number((orderStats._sum.total || 0).toFixed(2))
  const totalVat = Number((orderStats._sum.taxAmount || 0).toFixed(2))
  const totalSubTotal = Number((orderStats._sum.subTotal || 0).toFixed(2))
  const totalDiscount = Number((orderStats._sum.discountAmount || 0).toFixed(2))

  return {
    totalOrders,
    totalCustomers,
    totalTables,
    totalPaidPayments: paidPaymentsCount,
    totalPendingPayments: pendingOrdersCount, // backward compatibility for UI
    totalPendingOrders: pendingOrdersCount,
    totalCancelledOrders: cancelledOrdersCount,
    totalPaidRevenue: Number((paidPaymentsAgg._sum.amount || 0).toFixed(2)),
    totalRevenue, // Exactly matches order total sales
    totalVat,
    totalSubTotal,
    totalDiscount,
  }
}

async function fetchWeeklyAnalyticsData() {
  const endKey = businessDateKey(new Date())
  const startKey = addDays(endKey, -6)
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const buckets = []

  for (let i = 0; i < 7; i++) {
    const key = addDays(startKey, i)
    const [year, month, day] = key.split('-').map(Number)
    const labelDate = new Date(Date.UTC(year, month - 1, day))
    buckets.push({
      key,
      name: dayLabels[labelDate.getUTCDay()],
      revenue: 0,
      orders: 0,
    })
  }

  const orders = await prisma.order.findMany({
    where: {
      status: { in: completedSaleStatuses },
      businessDate: { gte: dateFromKey(startKey), lte: dateFromKey(endKey) },
    },
    select: {
      total: true,
      businessDate: true,
    },
  })

  for (const order of orders) {
    const key = order.businessDate
      ? new Date(order.businessDate).toISOString().split('T')[0]
      : null
    const bucket = buckets.find((b) => b.key === key)
    if (!bucket) continue

    bucket.revenue += Number(order.total) || 0
    bucket.orders += 1
  }

  buckets.forEach((bucket) => {
    bucket.revenue = Number(bucket.revenue.toFixed(2))
    delete bucket.key
  })

  return buckets
}

async function fetchRecentOrdersForDashboard() {
  return prisma.order.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      table: { select: { id: true, number: true } },
      user: {
        select: {
          id: true,
          fullName: true,
          role: { select: { id: true, name: true } },
        },
      },
      orderitem: {
        include: {
          menuitem: { select: { id: true, name: true, price: true } },
        },
      },
    },
  })
}

async function fetchDashboardInitData() {
  const [summary, weekly, recentOrders] = await Promise.all([
    fetchDashboardSummaryData({}),
    fetchWeeklyAnalyticsData(),
    fetchRecentOrdersForDashboard(),
  ])
  return { summary, weekly, recentOrders }
}

export async function warmReportCaches() {
  await Promise.all([
    reportCache.get(reportCacheKey('summary', {}), () => fetchDashboardSummaryData({}), 90 * 1000),
    reportCache.get('weekly', () => fetchWeeklyAnalyticsData(), WEEKLY_TTL_MS),
    reportCache.get('dashboard-init', () => fetchDashboardInitData(), 90 * 1000),
  ]).catch(() => {})
}

function dateKeyFromQuery(value) {
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) return `${match[1]}-${match[2]}-${match[3]}`
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return businessDateKey(parsed)
}

const parseDateRange = (query = {}) => {
  const { startDate, endDate } = query
  if (!startDate && !endDate) return null

  const range = {}
  if (startDate) {
    const key = dateKeyFromQuery(startDate)
    if (key) range.gte = dateFromKey(key)
  }
  if (endDate) {
    const key = dateKeyFromQuery(endDate)
    if (key) range.lte = dateFromKey(key)
  }
  return Object.keys(range).length ? range : null
}

const currentBusinessDate = () => dateFromKey(businessDateKey(new Date()))

const getStartOfMonth = () => {
  const [year, month] = businessDateKey(new Date()).split('-')
  return dateFromKey(`${year}-${month}-01`)
}

const getEndOfMonth = () => {
  const [year, month] = businessDateKey(new Date()).split('-').map(Number)
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return dateFromKey(`${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`)
}

// DASHBOARD INIT — summary + weekly chart + recent orders in one round trip
export const getDashboardInit = async (req, res) => {
  try {
    const role = req.user?.role?.toLowerCase()
    if (role !== 'admin' && role !== 'manager') {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }

    const data = await reportCache.get(
      'dashboard-init',
      () => fetchDashboardInitData(),
      90 * 1000
    )

    return res.status(200).json({ success: true, data })
  } catch (error) {
    console.error('Get Dashboard Init Error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message,
    })
  }
}

// DASHBOARD SUMMARY
export const getDashboardSummary = async (req, res) => {
  try {
    const key = reportCacheKey('summary', req.query)
    const data = await reportCache.get(key, () => fetchDashboardSummaryData(req.query), 90 * 1000)

    return res.status(200).json({
      success: true,
      data,
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
        ...(dateRange ? { order: { businessDate: dateRange } } : {})
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
      where: {
        menuitem: { isSellable: true },
        ...(dateRange ? { order: { businessDate: dateRange } } : {}),
      },
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
      select: {
        id: true,
        name: true,
        category: {
          select: { name: true }
        }
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
            businessDate: dateRange
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
    const day = currentBusinessDate()

    const [ordersCount, payments, topItems] = await Promise.all([
      prisma.order.count({
        where: {
          businessDate: day
        }
      }),
      prisma.payment.findMany({
        where: {
          status: 'paid',
          order: {
            businessDate: day
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
            businessDate: day
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
        date: day,
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
          businessDate: {
            gte: start,
            lte: end
          }
        }
      }),
      prisma.payment.findMany({
        where: {
          status: 'paid',
          order: {
            businessDate: {
              gte: start,
              lte: end
            }
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
            businessDate: {
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
    const logs = await prisma.auditlog.findMany({
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

// FINANCE REPORT (Detailed)
export const getFinanceReport = async (req, res) => {
  try {
    const dateRange = parseDateRange(req.query)

    const payments = await prisma.payment.findMany({
      where: {
        status: 'paid',
        ...(dateRange ? { order: { businessDate: dateRange } } : {})
      },
      include: {
        order: {
          include: {
            orderitem: {
              where: { menuitem: { isSellable: true } },
              include: {
                menuitem: {
                  select: {
                    id: true,
                    name: true,
                    costPrice: true,
                    price: true
                  }
                }
              }
            }
          }
        }
      }
    })

    let totalRevenue = 0
    let totalCost = 0
    let totalVat = 0
    let transactionCount = payments.length
    
    const itemsList = []
    const breakdownByMethod = {}
    const breakdownBySource = {}

    payments.forEach(p => {
      const amount = Number(p.amount) || 0
      totalRevenue += amount
      
      // By Method
      const method = p.method || 'Unknown'
      if (!breakdownByMethod[method]) breakdownByMethod[method] = 0
      breakdownByMethod[method] += amount

      // By Source (from Order)
      const source = p.order?.source || 'pos'
      if (!breakdownBySource[source]) breakdownBySource[source] = 0
      breakdownBySource[source] += amount

      let orderVat = Number(p.order?.taxAmount) || 0
      let calculatedItemsVat = 0

      // Items calculation
      if (p.order && p.order.orderitem) {
        p.order.orderitem.forEach(item => {
          const cost = (item.menuitem?.costPrice || 0) * item.quantity
          const selling = item.unitPrice * item.quantity
          const itemTaxRate = Number(item.tax) || 0
          
          let itemVat = 0
          if (itemTaxRate > 0) {
            itemVat = selling * (itemTaxRate / 100)
          } else if (orderVat > 0 && (p.order?.subTotal || 0) > 0) {
            itemVat = orderVat * (selling / p.order.subTotal)
          }

          calculatedItemsVat += itemVat
          totalCost += cost
          
          const profit = selling - cost - itemVat

          itemsList.push({
            id: item.id,
            orderId: p.orderId,
            name: item.menuitem?.name || 'Unknown',
            quantity: item.quantity,
            costPrice: item.menuitem?.costPrice || 0,
            sellingPrice: item.unitPrice,
            totalCost: cost,
            totalSelling: selling,
            vat: Number(itemVat.toFixed(2)),
            profit: Number(profit.toFixed(2)),
            date: p.paidAt,
            paymentMethod: p.method || 'unknown',
            providerName: p.providerName || null,
          })
        })
      }

      if (orderVat === 0 && calculatedItemsVat > 0) {
        orderVat = calculatedItemsVat
      }

      totalVat += orderVat
    })

    totalRevenue = Number(totalRevenue.toFixed(2))
    totalCost = Number(totalCost.toFixed(2))
    totalVat = Number(totalVat.toFixed(2))
    const netRevenue = Number(Math.max(0, totalRevenue - totalVat).toFixed(2))
    const netProfit = Number((totalRevenue - totalVat - totalCost).toFixed(2))
    const averageTransaction = transactionCount > 0 ? Number((totalRevenue / transactionCount).toFixed(2)) : 0

    return res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        totalVat,
        netRevenue,
        totalCost,
        netProfit,
        averageTransaction,
        transactionCount,
        breakdownByMethod,
        breakdownBySource,
        items: itemsList.sort((a, b) => new Date(b.date) - new Date(a.date))
      }
    })
  } catch (error) {
    console.error('Finance Report Error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// WEEKLY REVENUE CHART (last 7 days)
export const getWeeklyAnalytics = async (req, res) => {
  try {
    const data = await reportCache.get('weekly', () => fetchWeeklyAnalyticsData(), WEEKLY_TTL_MS)

    return res.status(200).json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Weekly Analytics Error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch weekly analytics',
      error: error.message,
    })
  }
}

// ORDERS REPORT (Detailed with Category & Item Sales)
export const getOrdersReport = async (req, res) => {
  try {
    const dateRange = parseDateRange(req.query)
    const orderWhere = {
      ...(dateRange ? { businessDate: dateRange } : {}),
      status: { in: completedSaleStatuses },
    }

    const [orders, stats, cancelledCount] = await Promise.all([
      prisma.order.findMany({
        where: orderWhere,
        include: {
          table: true,
          customer: true,
          orderitem: {
            include: {
              menuitem: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.aggregate({
        where: orderWhere,
        _count: { id: true },
        _sum: {
          total: true,
          subTotal: true,
          taxAmount: true,
          discountAmount: true,
        },
      }),
      prisma.order.count({
        where: {
          ...(dateRange ? { businessDate: dateRange } : {}),
          status: 'cancelled',
        },
      }),
    ])

    const breakdownByType = {}
    const breakdownBySource = {}
    const categoryMap = {}
    let totalItemsSold = 0

    orders.forEach((o) => {
      breakdownByType[o.orderType] = (breakdownByType[o.orderType] || 0) + 1
      breakdownBySource[o.source] = (breakdownBySource[o.source] || 0) + 1

      if (!o.orderitem || o.orderitem.length === 0) return

      const orderTaxAmount = Number(o.taxAmount) || 0
      const orderDiscountAmount = Number(o.discountAmount) || 0

      // Calculate raw items subtotal for this order to apportion tax & discount proportionally
      const itemsRawSum = o.orderitem.reduce(
        (s, it) => s + (Number(it.unitPrice) || 0) * (Number(it.quantity) || 1),
        0
      )

      o.orderitem.forEach((item) => {
        const catName = item.menuitem?.category?.name || 'Uncategorized'
        const itemName = item.menuitem?.name || 'Unknown Item'
        const qty = Number(item.quantity) || 1
        const unitPrice = Number(item.unitPrice) || 0
        const rawSub = unitPrice * qty

        const ratio = itemsRawSum > 0 ? rawSub / itemsRawSum : 1 / o.orderitem.length
        const itemTax =
          orderTaxAmount > 0
            ? orderTaxAmount * ratio
            : rawSub * ((Number(item.tax) || 0) / 100)
        const itemDiscount = orderDiscountAmount > 0 ? orderDiscountAmount * ratio : 0
        const itemNet = rawSub - itemDiscount
        const itemTotal = itemNet + itemTax

        totalItemsSold += qty

        if (!categoryMap[catName]) {
          categoryMap[catName] = {
            categoryName: catName,
            totalQuantity: 0,
            totalAmount: 0,
            totalVat: 0,
            totalNet: 0,
            itemsMap: {},
          }
        }

        categoryMap[catName].totalQuantity += qty
        categoryMap[catName].totalAmount += itemTotal
        categoryMap[catName].totalVat += itemTax
        categoryMap[catName].totalNet += itemNet

        if (!categoryMap[catName].itemsMap[itemName]) {
          categoryMap[catName].itemsMap[itemName] = {
            name: itemName,
            quantity: 0,
            totalAmount: 0,
            vat: 0,
            netAmount: 0,
            unitPrice: unitPrice,
          }
        }

        categoryMap[catName].itemsMap[itemName].quantity += qty
        categoryMap[catName].itemsMap[itemName].totalAmount += itemTotal
        categoryMap[catName].itemsMap[itemName].vat += itemTax
        categoryMap[catName].itemsMap[itemName].netAmount += itemNet
      })
    })

    const categorySales = Object.values(categoryMap)
      .map((cat) => ({
        categoryName: cat.categoryName,
        totalQuantity: Number(cat.totalQuantity.toFixed(1)),
        totalAmount: Number(cat.totalAmount.toFixed(2)),
        totalVat: Number(cat.totalVat.toFixed(2)),
        totalNet: Number(cat.totalNet.toFixed(2)),
        items: Object.values(cat.itemsMap)
          .map((it) => ({
            name: it.name,
            quantity: Number(it.quantity.toFixed(1)),
            totalAmount: Number(it.totalAmount.toFixed(2)),
            vat: Number(it.vat.toFixed(2)),
            netAmount: Number(it.netAmount.toFixed(2)),
            unitPrice: it.unitPrice,
          }))
          .sort((a, b) => b.totalAmount - a.totalAmount),
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)

    const totalOrders = stats._count.id || orders.length
    const totalAmount = Number((stats._sum.total || 0).toFixed(2))
    const totalVat = Number((stats._sum.taxAmount || 0).toFixed(2))
    const totalSubTotal = Number((stats._sum.subTotal || 0).toFixed(2))
    const totalDiscount = Number((stats._sum.discountAmount || 0).toFixed(2))
    const totalNet = Number((totalSubTotal - totalDiscount).toFixed(2))

    // Top 5 Sales items by total sales revenue
    const allItemsList = []
    categorySales.forEach((cat) => {
      cat.items.forEach((it) => {
        allItemsList.push({
          name: it.name,
          categoryName: cat.categoryName,
          quantity: it.quantity,
          totalAmount: it.totalAmount,
          vat: it.vat,
          netAmount: it.netAmount,
          unitPrice: it.unitPrice,
        })
      })
    })
    const top5Sales = allItemsList
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5)

    return res.status(200).json({
      success: true,
      data: {
        totalOrders,
        cancelledOrders: cancelledCount,
        totalAmount,
        totalVat,
        totalSubTotal,
        totalDiscount,
        totalNet,
        totalItemsSold,
        top5Sales,
        categorySales,
        breakdownByType,
        breakdownBySource,
        orders: orders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          customerName: o.customerName || o.customer?.name || null,
          customerPhone: o.customerPhone || o.customer?.phone || null,
          source: o.source,
          orderType: o.orderType,
          status: o.status,
          total: o.total,
          taxAmount: o.taxAmount,
          subTotal: o.subTotal,
          discountAmount: o.discountAmount,
          createdAt: o.createdAt,
          tableId: o.tableId,
          table: o.table ? { number: o.table.number } : null,
          itemCount: o.orderitem?.reduce((sum, it) => sum + (it.quantity || 1), 0) || 0,
        })),
      },
    })
  } catch (error) {
    console.error('Orders Report Error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// CLIENTS REPORT
export const getClientsReport = async (req, res) => {
  try {
    const dateRange = parseDateRange(req.query)

    // Find customers who have made orders
    const customers = await prisma.customers.findMany({
      include: {
        order: {
          where: dateRange ? { businessDate: dateRange } : {},
          select: { total: true, source: true, createdAt: true }
        }
      }
    })

    const clientStats = customers.map(c => {
      const totalSpent = c.order.reduce((sum, o) => sum + o.total, 0)
      const orderCount = c.order.length
      
      // Determine primary source
      const sources = {}
      c.order.forEach(o => { sources[o.source] = (sources[o.source] || 0) + 1 })
      const primarySource = Object.keys(sources).reduce((a, b) => (sources[a] || 0) > (sources[b] || 0) ? a : b, 'pos')

      return {
        id: c.id,
        fullName: c.name,
        phone: c.phone,
        totalSpent,
        orderCount,
        primarySource,
        lastOrder: c.order.length > 0 ? c.order[c.order.length - 1].createdAt : null
      }
    }).filter(c => c.orderCount > 0)
      .sort((a, b) => b.totalSpent - a.totalSpent)

    return res.status(200).json({
      success: true,
      data: {
        totalClients: clientStats.length,
        topClients: clientStats.slice(0, 20),
        fullStats: clientStats
      }
    })
  } catch (error) {
    console.error('Clients Report Error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}
