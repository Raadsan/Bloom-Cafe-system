import { getIO } from '../socket.js'

// NEW ORDER → KITCHEN
export const emitNewOrder = (order) => {
  const io = getIO()

  io.to('kitchen').emit('new_order', {
    id: order.id,
    table: order.table?.number,
    items: order.items,
    total: order.total
  })
}

// ORDER UPDATE → WAITER + CUSTOMER
export const emitOrderUpdate = (order) => {
  const io = getIO()

  io.to('waiter').emit('order_update', order)

  io.to(`order_${order.id}`).emit('order_update', order)
}

// PAYMENT SUCCESS → CUSTOMER
export const emitPaymentSuccess = (order) => {
  const io = getIO()

  io.to(`order_${order.id}`).emit('payment_success', {
    orderId: order.id
  })
}