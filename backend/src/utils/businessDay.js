import prisma from '../config/db.js'

/** Cafe clock is East Africa Time (UTC+3), same offset Date#getTimezoneOffset uses. */
export const BUSINESS_TZ_OFFSET_MINUTES = -180
/** Orders from midnight until 1:00 AM still belong to the previous business day. */
export const DAY_CUTOFF_MINUTES = 60
export const IDLE_CLOSE_MS = 2 * 60 * 60 * 1000

export function dateFromKey(key) {
  const [year, month, day] = String(key).split('-').map(Number)
  // MySQL DATE compares as midnight. A noon timestamp misses that whole day.
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
}

export function formatDateKey(value) {
  if (!value) return null
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10)
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addDays(key, days) {
  const [year, month, day] = String(key).split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day + days))
  return formatDateKey(date)
}

export function businessDateKey(instant = new Date(), offsetMinutes = BUSINESS_TZ_OFFSET_MINUTES) {
  const local = new Date(instant.getTime() - offsetMinutes * 60 * 1000)
  let year = local.getUTCFullYear()
  let month = local.getUTCMonth()
  let day = local.getUTCDate()
  const minutes = local.getUTCHours() * 60 + local.getUTCMinutes()
  if (minutes < DAY_CUTOFF_MINUTES) {
    const previous = new Date(Date.UTC(year, month, day - 1))
    year = previous.getUTCFullYear()
    month = previous.getUTCMonth()
    day = previous.getUTCDate()
  }
  return formatDateKey(new Date(Date.UTC(year, month, day)))
}

/** Created-at window for a business date: 1:00 AM that day through 12:59 AM the next day. */
export function businessWindow(startKey, endKey, offsetMinutes = BUSINESS_TZ_OFFSET_MINUTES) {
  const start = zonedInstant(startKey, 1, 0, 0, 0, offsetMinutes)
  const end = new Date(zonedInstant(addDays(endKey, 1), 1, 0, 0, 0, offsetMinutes).getTime() - 1)
  return { gte: start, lte: end }
}

function zonedInstant(key, hour, minute, second, ms, offsetMinutes) {
  const [year, month, day] = String(key).split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day, hour, minute, second, ms) + offsetMinutes * 60 * 1000)
}

function isDuplicateError(error) {
  const message = String(error?.message || '')
  return error?.code === 'P2002' || /duplicate|already exists/i.test(message)
}

export async function ensureBusinessDayStorage() {
  await prisma.$executeRawUnsafe('ALTER TABLE `order` ADD COLUMN `businessDate` DATE NULL').catch((error) => {
    if (!isDuplicateError(error)) throw error
  })
  await prisma.$executeRawUnsafe('CREATE INDEX `order_businessDate_idx` ON `order` (`businessDate`)').catch((error) => {
    if (!isDuplicateError(error)) throw error
  })
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS \`business_day_close\` (
      \`id\` INTEGER NOT NULL AUTO_INCREMENT,
      \`businessDate\` DATE NOT NULL,
      \`closedAt\` DATETIME(3) NOT NULL,
      \`reason\` VARCHAR(16) NOT NULL,
      \`userId\` INTEGER NULL,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      UNIQUE INDEX \`business_day_close_businessDate_key\`(\`businessDate\`),
      PRIMARY KEY (\`id\`)
    )
  `)
}

export async function backfillBusinessDates() {
  await ensureBusinessDayStorage()
  const missing = await prisma.$executeRawUnsafe(`
    UPDATE \`order\`
    SET businessDate = DATE(
      IF(
        TIME(DATE_ADD(createdAt, INTERVAL 3 HOUR)) < '01:00:00',
        DATE_SUB(DATE_ADD(createdAt, INTERVAL 3 HOUR), INTERVAL 1 DAY),
        DATE_ADD(createdAt, INTERVAL 3 HOUR)
      )
    )
    WHERE businessDate IS NULL
  `)

  const mismatched = await prisma.$executeRawUnsafe(`
    UPDATE journal_entries je
    INNER JOIN \`order\` o ON o.journalEntryId = je.id
    SET je.entry_date = o.businessDate
    WHERE o.businessDate IS NOT NULL
      AND je.source_type = 'pos_order'
      AND DATE(je.entry_date) <> o.businessDate
  `)
  if (Number(missing) || Number(mismatched)) {
    console.log(`[BusinessDay] Backfilled ${Number(missing) || 0} orders and moved ${Number(mismatched) || 0} journal dates`)
  }
}

async function findClose(key) {
  return prisma.business_day_close.findUnique({ where: { businessDate: dateFromKey(key) } })
}

export async function ensureIdleClose(now = new Date()) {
  const last = await prisma.order.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true, businessDate: true },
  })
  if (!last?.createdAt) return null
  if (now.getTime() - new Date(last.createdAt).getTime() < IDLE_CLOSE_MS) return null
  const key = formatDateKey(last.businessDate) || businessDateKey(last.createdAt)
  const existing = await findClose(key)
  if (existing) return existing
  try {
    return await prisma.business_day_close.create({
      data: {
        businessDate: dateFromKey(key),
        closedAt: new Date(new Date(last.createdAt).getTime() + IDLE_CLOSE_MS),
        reason: 'idle',
      },
    })
  } catch (error) {
    if (isDuplicateError(error)) return findClose(key)
    throw error
  }
}

export async function resolveBusinessDate(instant = new Date()) {
  await ensureIdleClose(instant)
  let key = businessDateKey(instant)
  const close = await findClose(key)
  if (close && new Date(close.closedAt).getTime() <= instant.getTime()) {
    key = addDays(key, 1)
  }
  return dateFromKey(key)
}

export async function getBusinessDayStatus(now = new Date()) {
  await ensureIdleClose(now)
  const businessDate = businessDateKey(now)
  const close = await findClose(businessDate)
  const closed = Boolean(close && new Date(close.closedAt).getTime() <= now.getTime())
  return {
    businessDate,
    closed,
    canClose: !closed,
    closedAt: closed ? close.closedAt : null,
    reason: closed ? close.reason : null,
  }
}

export async function closeBusinessDay(userId, now = new Date()) {
  await ensureIdleClose(now)
  const businessDate = businessDateKey(now)
  const existing = await findClose(businessDate)
  if (existing && new Date(existing.closedAt).getTime() <= now.getTime()) {
    const error = new Error('This business day is already closed')
    error.statusCode = 409
    throw error
  }
  const close = await prisma.business_day_close.create({
    data: {
      businessDate: dateFromKey(businessDate),
      closedAt: now,
      reason: 'manual',
      userId: userId || null,
    },
  })
  return {
    businessDate,
    closed: true,
    canClose: false,
    closedAt: close.closedAt,
    reason: close.reason,
  }
}
