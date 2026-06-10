import prisma from '../config/db.js'
import { emitNewOrder, emitOrderReady } from './socketEvents.js'
import { loadSenderFields, resolveSenderForOrder } from './notificationSender.js'

function getTableLabel(order) {
  if (order.table?.number) return `Table ${order.table.number}`
  const type = (order.orderType || '').toLowerCase()
  if (type === 'takeaway') return 'Takeaway'
  if (type === 'delivery') return 'Delivery'
  return 'Walk-in'
}

/**
 * New order entered kitchen queue — notify kitchen + all waiters.
 */
export async function notifyNewOrder(order, senderId = null) {
  if (!order?.id) return

  const label = getTableLabel(order)
  const itemCount =
    order.orderitem?.reduce?.((s, i) => s + (i.quantity || 0), 0) ??
    order.orderitem?.length ??
    0

  const sender = await resolveSenderForOrder(order, senderId)

  const base = {
    title: 'New Order',
    orderId: order.id,
    ...sender,
  }

  await prisma.notification.createMany({
    data: [
      {
        ...base,
        message: `Order #${order.id} — ${label}${itemCount ? ` (${itemCount} items)` : ''} waiting in kitchen`,
        role: 'kitchen',
      },
      {
        ...base,
        message: `Order #${order.id} — ${label} received and sent to kitchen`,
        role: 'waiter',
        userId: null,
      },
    ],
  })

  emitNewOrder(order)
}

/**
 * Order ready — notify waiters (+ order creator) and dine-in customer.
 */
export async function notifyOrderReady(order, senderId = null) {
  if (!order?.id) return

  const label = getTableLabel(order)
  const sender = await loadSenderFields(senderId || order?.userId || null)

  const notifications = [
    {
      title: 'Order Ready',
      message: `Order #${order.id} is ready — pick up for ${label}`,
      role: 'waiter',
      orderId: order.id,
      userId: null,
      ...sender,
    },
    {
      title: 'Order Ready',
      message: `Order #${order.id} for ${label} is ready for pickup`,
      role: 'kitchen',
      orderId: order.id,
      ...sender,
    },
  ]

  const orderType = (order.orderType || 'dine-in').toLowerCase()
  if (orderType === 'dine-in') {
    notifications.push({
      title: 'Your Order is Ready',
      message: order.table?.number
        ? `Your food is ready! It will be served at Table ${order.table.number}.`
        : 'Your food is ready! Please collect from the counter.',
      role: 'customer',
      orderId: order.id,
      customerId: order.customerId || null,
      senderId: sender.senderId,
      senderName: sender.senderName,
      senderAvatarUrl: sender.senderAvatarUrl,
    })
  }

  await prisma.notification.createMany({ data: notifications })
  emitOrderReady(order)
}
