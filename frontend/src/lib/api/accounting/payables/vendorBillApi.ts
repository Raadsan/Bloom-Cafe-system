import { createAccountingCrudApi, type AccountingRecord } from '../accountingCrud';
export type VendorBillLine = {
  id?: number;
  product_id?: number | null;
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  tax_id?: number | null;
  expense_account_id: number;
  subtotal?: number;
};
export type VendorBill = AccountingRecord & {
  bill_number?: string;
  vendor_id: number;
  reversed_bill_id?: number | null;
  bill_date: string;
  received_date?: string | null;
  due_date?: string | null;
  state: string;
  payment_state: string;
  amount_untaxed: number;
  amount_tax: number;
  amount_total: number;
  amount_due: number;
  vendors?: { id: number; name: string; phone?: string; email?: string; vendor_code?: string };
  currencies?: { id: number; code: string; symbol?: string };
  vendor_bill_lines?: VendorBillLine[];
};
const bills = createAccountingCrudApi<VendorBill>('/accounting/vendor-bills');
export const vendorBillApi = {
  ...bills,
  post: async (id: number): Promise<VendorBill> => {
    const response = await (await import('../../axios')).default.post(`/accounting/vendor-bills/${id}/post`);
    return response.data.data;
  },
};
const refunds = createAccountingCrudApi<VendorBill>('/accounting/vendor-bills/refunds');
export const vendorRefundApi = {
  ...refunds,
  post: async (id: number): Promise<VendorBill> => {
    const response = await (await import('../../axios')).default.post(`/accounting/vendor-bills/refunds/${id}/post`);
    return response.data.data;
  },
};
