/**
 * Waafi Mobile Money Payment Utility
 * Uses Node.js built-in fetch (Node 18+) — no external dependency needed.
 */

const WAAFI_URL = 'https://api.waafipay.net/asm'

/**
 * Send a Waafi mobile money payment request.
 *
 * @param {Object} params
 * @param {string} params.transactionId  - Internal reference (e.g. "PAY-1716100000-1234")
 * @param {string} params.accountNo      - Customer's Waafi phone (e.g. "252615000000")
 * @param {number} params.amount         - Amount in USD
 * @param {string} params.description    - Payment description shown to the customer
 * @returns {Object} { responseCode, responseMsg, referenceId, raw }
 */
export const sendWaafiPayment = async ({ transactionId, accountNo, amount, description }) => {
  const merchantUid = process.env.WAAFI_MERCHANT_UID
  const apiUserId   = process.env.WAAFI_API_USER_ID
  const apiKey      = process.env.WAAFI_API_KEY

  if (!merchantUid || !apiUserId || !apiKey) {
    throw new Error('Waafi credentials missing in .env (WAAFI_MERCHANT_UID, WAAFI_API_USER_ID, WAAFI_API_KEY)')
  }

  const payload = {
    schemaVersion: '1.0',
    requestId:     transactionId,
    timestamp:     new Date().toISOString(),
    channelName:   'WEB',
    serviceName:   'API_PURCHASE',
    serviceParams: {
      merchantUid,
      apiUserId,
      apiKey,
      paymentMethod: 'MWALLET_ACCOUNT',
      payerInfo:     { accountNo },
      transactionInfo: {
        referenceId:  transactionId,
        invoiceId:    transactionId,
        amount:       Number(amount).toFixed(2),
        currency:     'USD',
        description:  description || 'Restaurant Payment'
      }
    }
  }

  try {
    const response = await fetch(WAAFI_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
      signal:  AbortSignal.timeout(30000)  // 30 s timeout (Node 17.3+)
    })

    const data = await response.json()
    console.log('Waafi API Response:', JSON.stringify(data, null, 2))

    return {
      responseCode: data?.responseCode ?? data?.params?.responseCode ?? 'ERR',
      responseMsg:  data?.responseMsg  ?? data?.params?.description ?? data?.params?.responseMsg ?? 'Unknown error',
      referenceId:  data?.params?.transactionId ?? data?.responseId ?? transactionId,
      raw:          data
    }
  } catch (err) {
    console.error('Waafi API Error:', err.message)
    return {
      responseCode: 'ERR',
      responseMsg:  err.message,
      referenceId:  null,
      raw:          null
    }
  }
}
