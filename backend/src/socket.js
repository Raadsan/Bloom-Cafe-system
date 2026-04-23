import { Server } from 'socket.io'

let io

export const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: '*' }
  })

  io.on('connection', (socket) => {
    console.log('✅ Connected:', socket.id)

    // JOIN ROLE (kitchen, waiter, admin...)
    socket.on('join_role', (role) => {
      socket.join(role)
      console.log(`Joined role: ${role}`)
    })

    // JOIN SPECIFIC ORDER (customer)
    socket.on('join_order', (orderId) => {
      socket.join(`order_${orderId}`)
      console.log(`Joined order room: ${orderId}`)
    })

    // LEAVE ROOM (optional)
    socket.on('leave_room', (room) => {
      socket.leave(room)
    })

    socket.on('disconnect', () => {
      console.log('❌ Disconnected:', socket.id)
    })
  })
}

export const getIO = () => {
  if (!io) throw new Error('Socket not initialized')
  return io
}