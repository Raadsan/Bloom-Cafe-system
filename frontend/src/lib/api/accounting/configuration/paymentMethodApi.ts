import { createAccountingCrudApi, type AccountingRecord } from '../accountingCrud';
export type AccountingPaymentMethod = AccountingRecord;
export const accountingPaymentMethodApi = createAccountingCrudApi<AccountingPaymentMethod>('/accounting/configuration/payment-methods');
