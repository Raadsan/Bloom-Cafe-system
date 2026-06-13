// import app from './src/app.js';

// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//     console.log(`✅ Server running on port ${PORT}`);
// });

import http from 'http'
import app from './src/app.js'
import { initSocket } from './src/socket.js'
import prisma from './src/config/db.js'
import {
  ensureRoomsMenuItem,
  ensureCreateOrderMenuItem,
  ensurePickupOrdersMenuItem,
  ensurePickupHistoryMenuItem,
  ensureDiscountAdvertisementMenuItem,
} from './src/controllers/menuController.js'

const server = http.createServer(app)

// CONNECT SOCKET
initSocket(server)

const PORT = process.env.PORT || 5000

server.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`)
  try {
    await ensureRoomsMenuItem()
    await ensureCreateOrderMenuItem()
    await ensurePickupOrdersMenuItem()
    await ensurePickupHistoryMenuItem()
    await ensureDiscountAdvertisementMenuItem()
    console.log('✅ Sidebar menus ensured (Rooms, Create Order, Ready Pickup, Pickup History, Promotions)')
  } catch (err) {
    console.warn('Sidebar menu ensure skipped:', err?.message)
  }
})

async function shutdown() {
  await prisma.$disconnect().catch(() => {})
  server.close(() => process.exit(0))
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)