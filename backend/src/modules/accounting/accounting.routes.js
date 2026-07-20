import express from 'express'
import accountTypesRoutes from './configuration/accountTypes/accountType.routes.js'
import currenciesRoutes from './configuration/currencies/currency.routes.js'
import companiesRoutes from './configuration/companies/company.routes.js'
import chartOfAccountsRoutes from './chartOfAccounts/chartOfAccount.routes.js'
import paymentMethodsRoutes from './configuration/paymentMethods/paymentMethod.routes.js'
import paymentTermsRoutes from './configuration/paymentTerms/paymentTerm.routes.js'
import taxesRoutes from './configuration/taxes/tax.routes.js'
import productCategoriesRoutes from './configuration/productCategories/productCategory.routes.js'
import banksRoutes from './banks/bank.routes.js'
import fiscalYearsRoutes from './fiscalYears/fiscalYear.routes.js'
import fiscalPeriodsRoutes from './fiscalPeriods/fiscalPeriod.routes.js'
import journalsRoutes from './journals/journal.routes.js'
import customersRoutes from './customers/customer.routes.js'
import vendorsRoutes from './vendors/vendor.routes.js'
import productsRoutes from './products/product.routes.js'
import bankAccountsRoutes from './bankAccounts/bankAccount.routes.js'
import journalEntriesRoutes from './journalEntries/journalEntry.routes.js'
import customerInvoicesRoutes from './customerInvoices/customerInvoice.routes.js'
import customerReceiptsRoutes from './customerReceipts/customerReceipt.routes.js'
import vendorBillsRoutes from './vendorBills/vendorBill.routes.js'
import vendorPaymentsRoutes from './vendorPayments/vendorPayment.routes.js'
import reportsRoutes from './reports/reports.routes.js'
import sharedRoutes from './shared/shared.routes.js'

const router = express.Router()

router.use('/configuration/account-types', accountTypesRoutes)
router.use('/configuration/currencies', currenciesRoutes)
router.use('/configuration/companies', companiesRoutes)
router.use('/chart-of-accounts', chartOfAccountsRoutes)
router.use('/configuration/payment-methods', paymentMethodsRoutes)
router.use('/configuration/payment-terms', paymentTermsRoutes)
router.use('/configuration/taxes', taxesRoutes)
router.use('/configuration/product-categories', productCategoriesRoutes)
router.use('/banks', banksRoutes)
router.use('/fiscal-years', fiscalYearsRoutes)
router.use('/fiscal-periods', fiscalPeriodsRoutes)
router.use('/journals', journalsRoutes)
router.use('/customers', customersRoutes)
router.use('/vendors', vendorsRoutes)
router.use('/products', productsRoutes)
router.use('/bank-accounts', bankAccountsRoutes)
router.use('/journal-entries', journalEntriesRoutes)
router.use('/customer-invoices', customerInvoicesRoutes)
router.use('/customer-receipts', customerReceiptsRoutes)
router.use('/vendor-bills', vendorBillsRoutes)
router.use('/vendor-payments', vendorPaymentsRoutes)
router.use('/reports', reportsRoutes)
router.use('/shared', sharedRoutes)

export default router