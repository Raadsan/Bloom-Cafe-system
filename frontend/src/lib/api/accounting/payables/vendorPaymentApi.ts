import { createAccountingCrudApi, type AccountingRecord } from '../accountingCrud';
export type VendorPayment = AccountingRecord;
export const vendorPaymentApi = createAccountingCrudApi<VendorPayment>('/accounting/vendor-payments');
