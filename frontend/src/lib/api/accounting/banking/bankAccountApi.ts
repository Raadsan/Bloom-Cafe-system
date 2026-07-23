import { createAccountingCrudApi, type AccountingRecord } from '../accountingCrud';
export type BankAccount = AccountingRecord;
export const bankAccountApi = createAccountingCrudApi<BankAccount>('/accounting/bank-accounts');
