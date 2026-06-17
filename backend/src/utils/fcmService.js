import admin from 'firebase-admin'
import prisma from '../config/db.js'

let initialized = false

function initFirebase() {
  if (initialized) return true

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (!json) {
    console.warn('FCM: set FIREBASE_SERVICE_ACCOUNT_JSON in .env to enable push notifications')
    return false
  }

  try {
    const serviceAccount = JSON.parse(json)
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    })
    initialized = true
    return true
  } catch (error) {
    console.error('FCM init failed:', error.message)
    return false
  }
}

function messageForStatus(status) {
  switch (status) {
    case 'pending':
      return 'Your order has been placed and is waiting for confirmation.'
    case 'paid':
      return 'Payment confirmed. Your order will be prepared soon.'
    case 'preparing':
      return 'Chef is preparing your order.'
    case 'ready':
      return 'Your order is ready for pickup or delivery!'
    case 'served':
      return 'Order completed. Enjoy your meal!'
    case 'cancelled':
      return 'Your order was cancelled.'
    default:
      return `Order status updated to ${status}.`
  }
}

export async function sendOrderStatusPush(userId, { orderId, status }) {
  if (!userId || !orderId || !status) return
  if (!initFirebase()) return

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { fcmToken: true },
  })

  if (!user?.fcmToken) return

  const normalized = String(status).toLowerCase().trim()
  const title = `Order #${orderId} Update`
  const body = messageForStatus(normalized)

  try {
    await admin.messaging().send({
      token: user.fcmToken,
      notification: { title, body },
      data: {
        orderId: String(orderId),
        status: normalized,
        type: 'order_status',
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'order_status_updates',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    })
  } catch (error) {
    const code = error?.code || ''
    if (
      code === 'messaging/registration-token-not-registered' ||
      code === 'messaging/invalid-registration-token'
    ) {
      await prisma.user.update({
        where: { id: userId },
        data: { fcmToken: null, fcmTokenUpdatedAt: null },
      })
    }
    console.error(`FCM send failed for user ${userId}:`, error.message)
  }
}
