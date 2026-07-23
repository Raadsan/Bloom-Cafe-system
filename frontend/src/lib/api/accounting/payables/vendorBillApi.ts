import { createAccountingCrudApi, type AccountingRecord } from '../accountingCrud';
export type VendorBill = AccountingRecord;
export const vendorBillApi = createAccountingCrudApi<VendorBill>('/accounting/vendor-bills');
