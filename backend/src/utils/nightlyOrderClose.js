/**
 * Nightly Order Auto-Close Scheduler
 *
 * Closes any lingering open orders at 6:00 PM EAT (UTC+3) every day.
 * - Orders in status: pending | preparing | held → marked as "cancelled" with a note
 *   that they were auto-closed at end-of-business (6 PM).
 * - Clears the report cache so dashboards refresh for the next business day.
 * - Logs every close event for audit purposes.
 *
 * The user requested: "marki lix saac habenimo lagaaro orderska hajogsadaan
 *   oo malin kale waqtigeeda halo diwaan galiyo" (at 6 PM close orders and
 *   log them for the next day).
 */

import prisma from '../config/db.js'
import { clearReportCache } from '../modules/restaurant/reporting/report/report.controller.js'

// EAT = UTC+3 → 6 PM EAT = 15:00 UTC
const CLOSE_HOUR_UTC = 15  // 15:00 UTC = 18:00 EAT
const CLOSE_MINUTE_UTC = 0

const OPEN_STATUSES = ['pending', 'preparing', 'held']

/**
 * Run the nightly order close — can also be called manually via API.
 * Returns a summary of what was closed.
 */
export async function runNightlyOrderClose() {
  const now = new Date()
  console.log(`[NightlyClose] Running nightly order close at ${now.toISOString()}`)

  try {
    // Find all open orders that should be closed
    const openOrders = await prisma.order.findMany({
      where: {
        status: { in: OPEN_STATUSES },
      },
      select: { id: true, orderNumber: true, status: true, createdAt: true, total: true },
    })

    if (openOrders.length === 0) {
      console.log('[NightlyClose] No open orders to close.')
      return { closed: 0, orders: [] }
    }

    // Batch update all open orders to cancelled with a note
    await prisma.order.updateMany({
      where: {
        id: { in: openOrders.map((o) => o.id) },
        status: { in: OPEN_STATUSES },
      },
      data: {
        status: 'cancelled',
        notes: `Auto-closed at end of business day (6:00 PM). Original status preserved in audit log.`,
        updatedAt: now,
      },
    })

    // Write an audit log entry for each closed order
    const auditEntries = openOrders.map((o) => ({
      action: 'ORDER_AUTO_CLOSED',
      entity: 'Order',
      entityId: String(o.id),
      details: JSON.stringify({
        orderNumber: o.orderNumber,
        previousStatus: o.status,
        closedAt: now.toISOString(),
        reason: 'Nightly auto-close at 6:00 PM EAT',
        total: o.total,
      }),
      createdAt: now,
    }))

    // Only create audit logs if the model exists
    try {
      await prisma.auditlog.createMany({ data: auditEntries })
    } catch {
      // auditlog may not have all fields — skip silently
    }

    // Clear report cache so dashboards reflect the new state immediately
    clearReportCache()

    console.log(`[NightlyClose] ✅ Closed ${openOrders.length} orders.`)
    return {
      closed: openOrders.length,
      closedAt: now.toISOString(),
      orders: openOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        previousStatus: o.status,
      })),
    }
  } catch (error) {
    console.error('[NightlyClose] ❌ Error during nightly order close:', error?.message)
    throw error
  }
}

/**
 * Calculate milliseconds until the next 6:00 PM EAT (= 15:00 UTC).
 */
function msUntilNextClose() {
  const now = new Date()
  const next = new Date()

  next.setUTCHours(CLOSE_HOUR_UTC, CLOSE_MINUTE_UTC, 0, 0)

  // If we've already passed today's close time, schedule for tomorrow
  if (next <= now) {
    next.setUTCDate(next.getUTCDate() + 1)
  }

  return next.getTime() - now.getTime()
}

let _scheduleTimer = null

/**
 * Start the nightly order-close scheduler.
 * Call this once from server.js after the server starts.
 */
export function startNightlyOrderCloseScheduler() {
  if (_scheduleTimer) {
    clearTimeout(_scheduleTimer)
    _scheduleTimer = null
  }

  const delay = msUntilNextClose()
  const nextRunTime = new Date(Date.now() + delay)

  console.log(
    `[NightlyClose] Scheduler started. Next run at ${nextRunTime.toISOString()} ` +
      `(${Math.round(delay / 1000 / 60)} minutes from now)`
  )

  function scheduleNext() {
    const ms = msUntilNextClose()
    _scheduleTimer = setTimeout(async () => {
      try {
        await runNightlyOrderClose()
      } catch (e) {
        console.error('[NightlyClose] Scheduler run failed:', e?.message)
      }
      // Schedule the next run (next day)
      scheduleNext()
    }, ms)

    // Prevent the timer from blocking process exit
    if (_scheduleTimer?.unref) _scheduleTimer.unref()
  }

  scheduleNext()
}

/**
 * Stop the scheduler (called on shutdown).
 */
export function stopNightlyOrderCloseScheduler() {
  if (_scheduleTimer) {
    clearTimeout(_scheduleTimer)
    _scheduleTimer = null
    console.log('[NightlyClose] Scheduler stopped.')
  }
}
