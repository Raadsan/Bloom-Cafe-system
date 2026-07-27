import prisma from '../../../config/db.js'

const WALLET_ACCOUNTS = [
  { code: 'WLT-MERCH', name: 'Mobile Wallet - Merchant' },
  { code: 'WLT-EVC', name: 'Mobile Wallet - EVC Plus' },
  { code: 'WLT-WAAFI', name: 'Mobile Wallet - Waafi' },
  { code: 'WLT-EDAHAB', name: 'Mobile Wallet - eDahab' },
  { code: 'WLT-PREMIER', name: 'Mobile Wallet - Premier Wallet' },
]

/** Creates only missing mobile-wallet asset accounts for every active company. */
export async function ensureWalletChartOfAccounts() {
  const accountType = await prisma.account_types.findFirst({
    where: { internal_group: 'asset', normal_balance: 'debit' },
    orderBy: { id: 'asc' },
    select: { id: true },
  })
  if (!accountType) throw new Error('Cannot create wallet accounts: no debit Asset account type is configured')

  const companies = await prisma.companies.findMany({
    where: { is_active: true },
    select: { id: true, currency_id: true },
  })
  let created = 0
  for (const company of companies) {
    for (const wallet of WALLET_ACCOUNTS) {
      const existing = await prisma.chart_of_accounts.findFirst({
        where: { company_id: company.id, OR: [{ code: wallet.code }, { name: wallet.name }] },
        select: { id: true },
      })
      if (existing) continue
      await prisma.chart_of_accounts.create({
        data: {
          company_id: company.id,
          code: wallet.code,
          name: wallet.name,
          account_type_id: accountType.id,
          currency_id: company.currency_id,
          is_reconcilable: true,
          allow_manual_entry: true,
          is_active: true,
          notes: 'Mobile wallet settlement account for POS payments.',
        },
      })
      created += 1
    }
  }
  return { created }
}
