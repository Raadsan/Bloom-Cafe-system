import { getIO } from '../socket.js'

// NEW ORDER → KITCHEN + EVERYONE
export const emitNewOrder = (order) => {
  const io = getIO()

  io.to('kitchen').emit('new_order', {
    id: order.id,
    table: order.table?.number,
    items: order.items,
    total: order.total
  })

  // Global refresh event for all dashboards and POS
  io.emit('refresh_orders')
}

// ORDER UPDATE → WAITER + CUSTOMER + EVERYONE
export const emitOrderUpdate = (order) => {
  const io = getIO()

  io.to('waiter').emit('order_update', order)
  io.to(`order_${order.id}`).emit('order_update', order)

  // Global refresh event for all dashboards and POS
  io.emit('refresh_orders')
}

// PAYMENT SUCCESS → CUSTOMER
export const emitPaymentSuccess = (order) => {
  const io = getIO()

  io.to(`order_${order.id}`).emit('payment_success', {
    orderId: order.id
  })
}