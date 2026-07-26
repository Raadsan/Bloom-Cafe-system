import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildPOSJournalPlan,
  classifyPOSPayment,
  processCompletedPOSOrder,
  retryFailedPOSAccounting,
} from '../src/modules/accounting/services/posOrderAccounting.service.js'

const baseOrder = {
  id: 7,
  orderNumber: 'POS-00000007',
  companyId: 1,
  currencyId: 1,
  customerId: null,
  customer: null,
  status: 'completed',
  source: 'pos',
  subTotal: 100,
  discountAmount: 0,
  taxAmount: 0,
  total: 100,
  updatedAt: new Date('2026-07-25T10:00:00Z'),
  payment: { status: 'paid', method: 'cash', paidAt: new Date('2026-07-25T09:59:00Z') },
  accountingStatus: 'pending',
  journalEntryId: null,
}

function plan(order = baseOrder, overrides = {}) {
  return buildPOSJournalPlan({
    order,
    settlementAccountId: 10,
    revenueAccountId: 20,
    taxAccountId: order.taxAmount ? 30 : null,
    currencyId: 1,
    ...overrides,
  })
}

test('successful cash order creates a balanced plan', () => {
  assert.equal(classifyPOSPayment({ method: 'cash' }), 'cash')
  const result = plan()
  assert.equal(result.debit, 100)
  assert.equal(result.credit, 100)
  assert.deepEqual(result.items.map((row) => [row.account_id, row.debit, row.credit]), [[10, 100, 0], [20, 0, 100]])
})

test('bank, card, and mobile money route to bank settlement', () => {
  for (const method of ['bank', 'card', 'transfer', 'waafi', 'evc_plus', 'edahab', 'premier_wallet']) {
    assert.equal(classifyPOSPayment({ method }), 'bank')
  }
})

test('credit sale routes to accounts receivable', () => {
  assert.equal(classifyPOSPayment({ method: 'credit' }), 'credit')
})

test('tax creates a separate Sales Tax Payable credit', () => {
  const result = plan({ ...baseOrder, subTotal: 100, taxAmount: 5, total: 105 })
  assert.equal(result.items.length, 3)
  assert.equal(result.items[2].account_id, 30)
  assert.equal(result.items[2].debit, 0)
  assert.equal(result.items[2].credit, 5)
  assert.equal(result.debit, result.credit)
})

test('discount consistently uses the net-revenue method', () => {
  const result = plan({ ...baseOrder, subTotal: 100, discountAmount: 10, taxAmount: 5, total: 95 })
  assert.equal(result.grossSales, 100)
  assert.equal(result.discount, 10)
  assert.equal(result.netSales, 90)
  assert.equal(result.items[0].debit, 95)
  assert.equal(result.items[1].credit, 90)
  assert.equal(result.items[2].credit, 5)
})

function mockDb({ order = baseOrder, existingEntry = null, configurationFailure = false } = {}) {
  const state = { orderUpdates: [], entries: [], failureUpdates: [] }
  const salesJournal = { id: 1, company_id: 1, code: 'POS', journal_type: 'sale', default_debit_account_id: 40, default_credit_account_id: 20, sequence_prefix: 'POS-', next_sequence: 1, is_active: true }
  const cashJournal = { id: 2, company_id: 1, code: 'CASH', journal_type: 'cash', default_debit_account_id: 10, default_credit_account_id: null, sequence_prefix: 'CASH-', next_sequence: 1, is_active: true }
  const bankJournal = { id: 3, company_id: 1, code: 'BANK', journal_type: 'bank', default_debit_account_id: 11, default_credit_account_id: null, sequence_prefix: 'BANK-', next_sequence: 1, is_active: true }
  let sourceLookup = true
  const tx = {
    $queryRawUnsafe: async () => [{ id: order.id }],
    order: {
      findUnique: async () => order,
      update: async ({ data }) => { state.orderUpdates.push(data); return { ...order, ...data } },
    },
    journal_entries: {
      findFirst: async () => {
        if (sourceLookup) { sourceLookup = false; return existingEntry }
        return null
      },
      create: async ({ data }) => {
        const entry = { id: 91, ...data, entry_number: data.entry_number, journal_items: data.journal_items.create }
        state.entries.push(entry)
        return entry
      },
    },
    companies: { findUnique: async () => ({ id: 1, currency_id: 1, is_active: true }), findMany: async () => [] },
    currencies: { findUnique: async () => ({ id: 1, is_active: true }) },
    fiscal_periods: { findFirst: async () => ({ id: 5, state: 'open' }) },
    journals: {
      findMany: async () => configurationFailure ? [] : [salesJournal, cashJournal, bankJournal],
      update: async ({ where }) => ({ next_sequence: where.id + 10 }),
    },
    taxes: { findMany: async () => [{ tax_account_id: 30 }] },
    chart_of_accounts: { findMany: async ({ where }) => where.id.in.map((id) => ({ id })) },
    bank_accounts: {
      findMany: async () => [{ id: 1, account_name: 'WAAFI Wallet', account_number: '001', gl_account_id: 11, journal_id: 3, journals: bankJournal }],
    },
  }
  const db = {
    $transaction: async (callback) => callback(tx),
    order: { updateMany: async ({ data }) => { state.failureUpdates.push(data); return { count: 1 } } },
  }
  return { db, state, tx, setConfigurationFailure: (value) => { configurationFailure = value } }
}

test('cancelled order and failed payment create no accounting entry', async () => {
  for (const order of [
    { ...baseOrder, status: 'cancelled' },
    { ...baseOrder, payment: { ...baseOrder.payment, status: 'failed' } },
  ]) {
    const mock = mockDb({ order })
    const result = await processCompletedPOSOrder(order.id, { db: mock.db })
    assert.equal(result.status, 'not_eligible')
    assert.equal(mock.state.entries.length, 0)
  }
})

test('successful processing posts one entry and links the order', async () => {
  const mock = mockDb()
  const result = await processCompletedPOSOrder(baseOrder.id, { db: mock.db })
  assert.equal(result.status, 'posted')
  assert.equal(mock.state.entries.length, 1)
  assert.equal(mock.state.entries[0].source_type, 'pos_order')
  assert.equal(mock.state.entries[0].state, 'posted')
  assert.equal(result.plan.debit, result.plan.credit)
  assert.equal(mock.state.orderUpdates.at(-1).journalEntryId, 91)
})

test('paid takeaway order in served terminal status posts without changing the order workflow', async () => {
  const order = { ...baseOrder, status: 'served' }
  const mock = mockDb({ order })
  const result = await processCompletedPOSOrder(order.id, { db: mock.db })
  assert.equal(result.status, 'posted')
  assert.equal(mock.state.entries.length, 1)
  assert.equal(mock.state.orderUpdates.some((update) => Object.hasOwn(update, 'status')), false)
})

test('successful bank, card, mobile, and credit orders use the configured settlement account', async () => {
  const cases = [
    ['bank', 11],
    ['card', 11],
    ['waafi', 11],
    ['credit', 40],
  ]
  for (const [method, expectedAccount] of cases) {
    const order = { ...baseOrder, payment: { ...baseOrder.payment, method } }
    const mock = mockDb({ order })
    const result = await processCompletedPOSOrder(order.id, { db: mock.db })
    assert.equal(result.status, 'posted')
    assert.equal(result.plan.items[0].account_id, expectedAccount)
    assert.equal(result.plan.debit, result.plan.credit)
  }
})

test('duplicate processing attaches the existing posted entry without creating another', async () => {
  const mock = mockDb({ existingEntry: { id: 77, state: 'posted', posted_at: new Date() } })
  const result = await processCompletedPOSOrder(baseOrder.id, { db: mock.db })
  assert.equal(result.status, 'already_posted')
  assert.equal(result.journalEntryId, 77)
  assert.equal(mock.state.entries.length, 0)
})

test('accounting failure marks FAILED and retry can post after configuration is repaired', async () => {
  const mock = mockDb({ configurationFailure: true })
  await assert.rejects(() => processCompletedPOSOrder(baseOrder.id, { db: mock.db }), /Sales journal/)
  assert.equal(mock.state.failureUpdates.at(-1).accountingStatus, 'failed')
  mock.setConfigurationFailure(false)
  const result = await retryFailedPOSAccounting(baseOrder.id, { db: mock.db })
  assert.equal(result.status, 'posted')
  assert.equal(mock.state.entries.length, 1)
})
