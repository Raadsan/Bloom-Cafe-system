// import app from './src/app.js';

// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//     console.log(`✅ Server running on port ${PORT}`);
// });

import 'dotenv/config'
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
  ensureCompositesMenuItem,
  warmAllMenusCache,
} from './src/controllers/menuController.js'
import { initFirebase } from './src/utils/fcmService.js'
import { warmAllMenuItemsCache } from './src/controllers/menuItemController.js'
import { warmCompositesCache, warmComboFormCache } from './src/controllers/compositeController.js'
import { warmReportCaches } from './src/controllers/reportController.js'
import { warmCategoryCaches } from './src/controllers/categoryController.js'
import { isDbAuthError, isDbUnreachableError } from './src/utils/dbErrors.js'

const skipStartupWarmup =
  process.env.SKIP_STARTUP_WARMUP === 'true' || process.env.SKIP_STARTUP_WARMUP === '1'

async function verifyDatabase() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    if (isDbAuthError(error)) {
      console.error(
        '❌ MySQL auth failed — check DATABASE_URL in backend/.env (user/password/database).'
      )
      console.error(
        '   Contabo: CREATE USER \'raadsan\'@\'%\' ... GRANT ALL ON bloom_cafe.* ... FLUSH PRIVILEGES;'
      )
    } else if (isDbUnreachableError(error)) {
      console.error('❌ Cannot reach MySQL — check IP, port 3306, firewall, MySQL service.')
    } else {
      console.error('❌ Database error:', error?.message)
    }
    return false
  }
}

async function runStartupWarmup() {
  await deactivateRoomsMenuItem()
  await deactivateSystemSettingsMenuItem()
  await ensureCreateOrderMenuItem()
  await ensurePickupOrdersMenuItem()
  await ensurePickupHistoryMenuItem()
  await ensureDiscountAdvertisementMenuItem()
  await ensureCompositesMenuItem()
  await warmAllMenusCache()
  await warmAllMenuItemsCache()
  await warmCompositesCache()
  await warmComboFormCache()
  await warmCategoryCaches()
  await warmReportCaches()
  console.log('✅ Sidebar menus ensured (Create Order, Ready Pickup, Pickup History, Promotions, Menu Combos)')
}

const server = http.createServer(app)

initSocket(server)

const PORT = process.env.PORT || 7000

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  initFirebase()

  setImmediate(async () => {
    const dbOk = await verifyDatabase()
    if (!dbOk) return

    if (skipStartupWarmup) {
      console.log('✅ Database run successfully')
      return
    }

    try {
      await runStartupWarmup()
    } catch (err) {
      console.warn('Sidebar menu ensure skipped:', err?.message)
    }
  })
})

async function shutdown(signal) {
  console.log(`\n${signal ?? 'Shutdown'}: releasing database connections...`)
  await prisma.$disconnect().catch(() => { })
  server.close(() => process.exit(0))
  setTimeout(() => process.exit(1), 5000).unref()
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

process.once('SIGUSR2', async () => {
  await prisma.$disconnect().catch(() => { })
  process.kill(process.pid, 'SIGUSR2')
})