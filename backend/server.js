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
  deactivateRoomsMenuItem,
  deactivateSystemSettingsMenuItem,
  ensureCreateOrderMenuItem,
  ensurePickupOrdersMenuItem,
  ensurePickupHistoryMenuItem,
  ensureDiscountAdvertisementMenuItem,
} from './src/controllers/menuController.js'
import { initFirebase } from './src/utils/fcmService.js'

const server = http.createServer(app)

// CONNECT SOCKET
initSocket(server)

const PORT = process.env.PORT || 5000

server.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`)
  initFirebase()
  try {
    await deactivateRoomsMenuItem()
    await deactivateSystemSettingsMenuItem()
    await ensureCreateOrderMenuItem()
    await ensurePickupOrdersMenuItem()
    await ensurePickupHistoryMenuItem()
    await ensureDiscountAdvertisementMenuItem()
    console.log('✅ Sidebar menus ensured (Create Order, Ready Pickup, Pickup History, Promotions)')
  } catch (err) {
    console.warn('Sidebar menu ensure skipped:', err?.message)
  }
})

async function shutdown(signal) {
  console.log(`\n${signal ?? 'Shutdown'}: releasing database connections...`)
  await prisma.$disconnect().catch(() => {})
  server.close(() => process.exit(0))
  setTimeout(() => process.exit(1), 5000).unref()
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

process.once('SIGUSR2', async () => {
  await prisma.$disconnect().catch(() => {})
  process.kill(process.pid, 'SIGUSR2')
})