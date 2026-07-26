'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Edit3, Eye, Plus, Printer, RefreshCw, Send, Trash2 } from 'lucide-react';
import { customerReceiptApi, type CustomerReceipt } from '@/lib/api/accounting/receivables/customerReceiptApi';
import { customerInvoiceApi, type CustomerInvoice } from '@/lib/api/accounting/receivables/customerInvoiceApi';
import { accountingCustomerApi } from '@/lib/api/accounting/receivables/customerApi';
import { accountingPaymentMethodApi } from '@/lib/api/accounting/configuration/paymentMethodApi';
import { companyApi } from '@/lib/api/accounting/configuration/companyApi';
import { currencyApi } from '@/lib/api/accounting/configuration/currencyApi';
import { accountingJournalApi } from '@/lib/api/accounting/ledger/journalApi';
import { useToast } from '@/components/ui/toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DashboardDataTable, { type DashboardTableColumn } from '@/components/shared/DashboardDataTable';
import { actionBtnDelete, actionBtnEdit, actionBtnView, btnCreatePage, dashboardSelectClass, dashboardStatusBadgeClass, pageHeaderTitleClass, pageHeaderWrapperClass } from '@/lib/dashboard-ui';

type Row = { id: number; [key: string]: unknown };
type Allocation = { invoice_id: number; allocated_amount: number };
type Form = {
  customer_id: string; journal_id: string; cash_bank_account_id: string; payment_method_id: string; receipt_date: string;
  currency_id: string; exchange_rate: string; amount: string; reference: string; memo: string;
  allocations: Allocation[];
};
const today = () => new Date().toISOString().slice(0, 10);
const emptyForm = (): Form => ({ customer_id: '', journal_id: '', cash_bank_account_id: '', payment_method_id: '', receipt_date: today(), currency_id: '', exchange_rate: '1', amount: '', reference: '', memo: '', allocations: [] });
const dateValue = (value: unknown) => value ? new Date(String(value)).toISOString().slice(0, 10) : '';
const money = (value: unknown, code = '') => `${code ? `${code} ` : ''}${Number(value || 0).toFixed(2)}`;
const message = (error: unknown) => axios.isAxiosError(error) ? error.response?.data?.message || error.message : error instanceof Error ? error.message : 'Something went wrong';

export default function CustomerReceiptsPage() {
  const { showToast } = useToast();
  const [receipts, setReceipts] = useState<CustomerReceipt[]>([]);
  const [customers, setCustomers] = useState<Row[]>([]);
  const [invoices, setInvoices] = useState<CustomerInvoice[]>([]);
  const [journals, setJournals] = useState<Row[]>([]);
  const [methods, setMethods] = useState<Row[]>([]);
  const [currencies, setCurrencies] = useState<Row[]>([]);
  const [companies, setCompanies] = useState<Row[]>([]);
  const [paymentOptions, setPaymentOptions] = useState<Array<{ id: number; code: string; name: string; account_name: string; journal_id: number; journal_name: string; journal_code: string }>>([]);
  const [form, setForm] = useState<Form>(emptyForm);
  const [selected, setSelected] = useState<CustomerReceipt | null>(null);
  const [open, setOpen] = useState(false);
  const [viewOnly, setViewOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [journalFilter, setJournalFilter] = useState('all');
  const [currencyFilter, setCurrencyFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [receiptRows, customerRows, invoiceRows, journalRows, methodRows, currencyRows, companyRows] = await Promise.all([
        customerReceiptApi.getAll(), accountingCustomerApi.getAll(), customerInvoiceApi.getAll(),
        accountingJournalApi.getAll(), accountingPaymentMethodApi.getAll(), currencyApi.getAll(), companyApi.getAll(),
      ]);
      setReceipts(receiptRows); setCustomers(customerRows); setInvoices(invoiceRows); setJournals(journalRows); setMethods(methodRows); setCurrencies(currencyRows);
      setCompanies(companyRows);
    } catch (error) { showToast(message(error), 'error'); } finally { setLoading(false); }
  }, [showToast]);
  useEffect(() => { void load(); }, [load]);

  const customer = customers.find((row) => row.id === Number(form.customer_id));
  const companyId = Number(customer?.company_id || 0);
  const selectedAccount = paymentOptions.find((row) => row.id === Number(form.cash_bank_account_id));
  const companyCurrencyId = Number(companies.find((row) => row.id === companyId)?.currency_id || 0);
  const openInvoices = invoices.filter((invoice) => {
    const alreadyAllocated = form.allocations.some((row) => row.invoice_id === invoice.id);
    return invoice.customer_id === Number(form.customer_id) && invoice.state === 'posted' &&
      (alreadyAllocated || ['not_paid', 'partial'].includes(invoice.payment_state)) &&
      Number(invoice.currency_id) === Number(form.currency_id);
  });
  const allocated = form.allocations.reduce((sum, row) => sum + Number(row.allocated_amount || 0), 0);
  const unallocated = Number(form.amount || 0) - allocated;
  const filtered = receipts.filter((receipt) => {
    const needle = query.toLowerCase().trim();
    const day = dateValue(receipt.receipt_date);
    return (!needle || [receipt.receipt_number, receipt.customers?.name, receipt.reference].some((value) => String(value || '').toLowerCase().includes(needle))) &&
      (status === 'all' || receipt.state === status) &&
      (customerFilter === 'all' || receipt.customer_id === Number(customerFilter)) &&
      (methodFilter === 'all' || receipt.payment_method_id === Number(methodFilter)) &&
      (journalFilter === 'all' || receipt.journal_id === Number(journalFilter)) &&
      (currencyFilter === 'all' || receipt.currency_id === Number(currencyFilter)) &&
      (!dateFrom || day >= dateFrom) && (!dateTo || day <= dateTo);
  });

  function newReceipt() {
    setSelected(null); setViewOnly(false); setPaymentOptions([]); setForm(emptyForm()); setOpen(true);
  }
  async function edit(receipt: CustomerReceipt, readOnly = false) {
    setSelected(receipt); setViewOnly(readOnly || receipt.state !== 'draft');
    let options: Awaited<ReturnType<typeof customerReceiptApi.options>> | null = null;
    try { options = await customerReceiptApi.options({ customer_id: receipt.customer_id, payment_method_id: receipt.payment_method_id, currency_id: receipt.currency_id }); setPaymentOptions(options.accounts); }
    catch { setPaymentOptions([]); }
    const accountId = receipt.journal_entries?.journal_items?.[0]?.account_id || options?.selected_account_id || '';
    setForm({
      customer_id: String(receipt.customer_id), journal_id: String(receipt.journal_id), cash_bank_account_id: String(accountId), payment_method_id: String(receipt.payment_method_id),
      receipt_date: dateValue(receipt.receipt_date), currency_id: String(receipt.currency_id), exchange_rate: String(receipt.exchange_rate || 1),
      amount: String(receipt.amount), reference: String(receipt.reference || ''), memo: String(receipt.memo || ''),
      allocations: (receipt.receipt_allocations || []).map((row) => ({ invoice_id: row.invoice_id, allocated_amount: Number(row.allocated_amount) })),
    });
    setOpen(true);
  }
  function selectCustomer(value: string) {
    const next = customers.find((row) => row.id === Number(value));
    const nextCompany = Number(next?.company_id || 0);
    const baseCurrency = companies.find((row) => row.id === nextCompany)?.currency_id;
    setPaymentOptions([]);
    setForm((current) => ({ ...current, customer_id: value, journal_id: '', cash_bank_account_id: '', payment_method_id: '', currency_id: String(baseCurrency || ''), exchange_rate: '1', allocations: [] }));
  }
  async function selectPaymentMethod(value: string) {
    setPaymentOptions([]);
    setForm((current) => ({ ...current, payment_method_id: value, journal_id: '', cash_bank_account_id: '' }));
    if (!value || !form.customer_id || !form.currency_id) return;
    try {
      const options = await customerReceiptApi.options({ customer_id: Number(form.customer_id), payment_method_id: Number(value), currency_id: Number(form.currency_id) });
      setPaymentOptions(options.accounts);
      const account = options.accounts.find((row) => row.id === options.selected_account_id);
      setForm((current) => ({ ...current, payment_method_id: value, cash_bank_account_id: account ? String(account.id) : '', journal_id: account ? String(account.journal_id) : '' }));
    } catch (error) { showToast(message(error), 'error'); }
  }
  function selectAccount(value: string) {
    const account = paymentOptions.find((row) => row.id === Number(value));
    setForm((current) => ({ ...current, cash_bank_account_id: value, journal_id: account ? String(account.journal_id) : '' }));
  }
  function toggleInvoice(invoice: CustomerInvoice) {
    const exists = form.allocations.some((row) => row.invoice_id === invoice.id);
    setForm((current) => ({ ...current, allocations: exists
      ? current.allocations.filter((row) => row.invoice_id !== invoice.id)
      : [...current.allocations, { invoice_id: invoice.id, allocated_amount: Math.min(Number(invoice.amount_due), Math.max(0, Number(current.amount) - current.allocations.reduce((sum, row) => sum + Number(row.allocated_amount), 0))) }],
    }));
  }
  function updateAllocation(invoiceId: number, value: string) {
    setForm((current) => ({ ...current, allocations: current.allocations.map((row) => row.invoice_id === invoiceId ? { ...row, allocated_amount: Number(value) } : row) }));
  }
  function autoAllocate() {
    let remaining = Number(form.amount || 0);
    const allocations: Allocation[] = [];
    [...openInvoices].sort((a, b) => dateValue(a.invoice_date).localeCompare(dateValue(b.invoice_date))).forEach((invoice) => {
      if (remaining <= 0) return;
      const amount = Math.min(remaining, Number(invoice.amount_due));
      if (amount > 0) allocations.push({ invoice_id: invoice.id, allocated_amount: Math.round(amount * 100) / 100 });
      remaining = Math.round((remaining - amount) * 100) / 100;
    });
    setForm((current) => ({ ...current, allocations }));
  }
  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true);
    try {
      const payload = { ...form, customer_id: Number(form.customer_id), journal_id: Number(form.journal_id), payment_method_id: Number(form.payment_method_id), currency_id: Number(form.currency_id), exchange_rate: Number(form.exchange_rate), amount: Number(form.amount), receipt_date: new Date(`${form.receipt_date}T00:00:00.000Z`).toISOString() };
      if (selected) await customerReceiptApi.update(selected.id, payload);
      else await customerReceiptApi.create(payload);
      showToast(selected ? 'Draft receipt updated successfully' : 'Draft receipt created successfully', 'success');
      setOpen(false); await load();
    } catch (error) { showToast(message(error), 'error'); } finally { setSaving(false); }
  }
  async function post(receipt: CustomerReceipt) {
    if (!window.confirm(`Post ${receipt.receipt_number}? This will update invoice balances and cannot be edited afterward.`)) return;
    try { await customerReceiptApi.post(receipt.id); showToast('Customer receipt posted successfully', 'success'); await load(); }
    catch (error) { showToast(message(error), 'error'); }
  }
  async function remove(receipt: CustomerReceipt) {
    if (!window.confirm(`Delete draft ${receipt.receipt_number}?`)) return;
    try { await customerReceiptApi.remove(receipt.id); showToast('Draft receipt deleted', 'success'); await load(); }
    catch (error) { showToast(message(error), 'error'); }
  }
  async function printReceipt(receipt: CustomerReceipt) {
    await edit(receipt, true);
    window.setTimeout(() => window.print(), 150);
  }
  const columns: DashboardTableColumn<CustomerReceipt>[] = [
    { key: 'number', header: 'Receipt', cell: (row) => <span className="font-bold text-primary">{row.receipt_number || `#${row.id}`}</span> },
    { key: 'date', header: 'Date', cell: (row) => dateValue(row.receipt_date) },
    { key: 'customer', header: 'Customer', cell: (row) => row.customers?.name || '—' },
    { key: 'method', header: 'Method', cell: (row) => row.payment_methods?.name || '—' },
    { key: 'journal', header: 'Journal', cell: (row) => row.journals?.name || '—' },
    { key: 'account', header: 'Cash/Bank Account', cell: (row) => row.journal_entries?.journal_items?.[0]?.chart_of_accounts ? `${row.journal_entries.journal_items[0].chart_of_accounts.code} — ${row.journal_entries.journal_items[0].chart_of_accounts.name}` : '—' },
    { key: 'currency', header: 'Currency', cell: (row) => row.currencies?.code || '—' },
    { key: 'amount', header: 'Amount', align: 'right', cell: (row) => <span className="font-semibold">{money(row.amount)}</span> },
    { key: 'allocated', header: 'Allocated', align: 'right', cell: (row) => money(Number(row.amount) - Number(row.unallocated_amount)) },
    { key: 'status', header: 'Status', align: 'center', cell: (row) => <span className={`${dashboardStatusBadgeClass} ${row.state === 'posted' ? 'bg-emerald-600 text-white' : row.state === 'cancelled' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'}`}>{row.state}</span> },
    { key: 'reference', header: 'Reference', cell: (row) => row.reference || '—' },
    { key: 'actions', header: 'Actions', align: 'right', cell: (row) => <div className="flex justify-end gap-1"><button title="View" onClick={() => void edit(row, true)} className={actionBtnView}><Eye className="size-4" /></button>{row.state === 'draft' && <><button title="Edit" onClick={() => void edit(row)} className={actionBtnEdit}><Edit3 className="size-4" /></button><button title="Post" onClick={() => void post(row)} className={actionBtnView}><Send className="size-4" /></button><button title="Delete" onClick={() => void remove(row)} className={actionBtnDelete}><Trash2 className="size-4" /></button></>}{row.state === 'posted' && <button title="Print" onClick={() => void printReceipt(row)} className={actionBtnView}><Printer className="size-4" /></button>}</div> },
  ];

  return (
    <div className="p-6 md:p-8">
      <div className={pageHeaderWrapperClass}><p className="text-xs font-bold uppercase tracking-[.2em] text-primary">Receivables</p><h1 className={pageHeaderTitleClass}>Customer Receipts</h1><p className="mt-1 text-sm text-muted-foreground">Record customer payments and allocate them to posted invoices.</p></div>
      <DashboardDataTable rows={filtered} columns={columns} loading={loading} searchValue={query} onSearchChange={setQuery} searchPlaceholder="Search receipts..." emptyText="No customer receipts found" minWidth="1500px" action={<button onClick={newReceipt} className={btnCreatePage}><Plus className="size-4" /> New receipt</button>} filters={<><select value={status} onChange={(e) => setStatus(e.target.value)} className={dashboardSelectClass}><option value="all">All statuses</option><option value="draft">Draft</option><option value="posted">Posted</option><option value="cancelled">Cancelled</option></select><select value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)} className={dashboardSelectClass}><option value="all">All customers</option>{customers.map((row) => <option key={row.id} value={row.id}>{String(row.name)}</option>)}</select><select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className={dashboardSelectClass}><option value="all">All methods</option>{methods.map((row) => <option key={row.id} value={row.id}>{String(row.name)}</option>)}</select><select value={journalFilter} onChange={(e) => setJournalFilter(e.target.value)} className={dashboardSelectClass}><option value="all">All journals</option>{journals.map((row) => <option key={row.id} value={row.id}>{String(row.name)}</option>)}</select><select value={currencyFilter} onChange={(e) => setCurrencyFilter(e.target.value)} className={dashboardSelectClass}><option value="all">All currencies</option>{currencies.map((row) => <option key={row.id} value={row.id}>{String(row.code)}</option>)}</select><input aria-label="Date from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={dashboardSelectClass} /><input aria-label="Date to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={dashboardSelectClass} /><button onClick={() => void load()} className="flex size-[42px] items-center justify-center rounded-md border"><RefreshCw className="size-4" /></button></>} />

      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto"><DialogHeader><DialogTitle>{viewOnly ? 'Customer receipt' : selected ? 'Edit draft receipt' : 'New customer receipt'}</DialogTitle><DialogDescription>Save as draft, review allocations, then post when the payment is confirmed.</DialogDescription></DialogHeader>
        <form onSubmit={save} className="space-y-5">
          <div className="grid gap-4 rounded-xl border bg-muted/30 p-4 md:grid-cols-2">
            <div><p className="text-xs font-semibold uppercase text-muted-foreground">Receipt Number</p><p className="mt-1 font-semibold">{selected?.receipt_number || 'Auto-generated (RCPT####)'}</p></div>
            <div><p className="text-xs font-semibold uppercase text-muted-foreground">Status</p><p className="mt-1 font-semibold uppercase">{selected?.state || 'draft'}</p></div>
          </div>
          <fieldset disabled={viewOnly || saving} className="grid gap-4 md:grid-cols-3">
            <label className="text-sm font-medium">Customer *<select required value={form.customer_id} onChange={(e) => selectCustomer(e.target.value)} className="mt-1 h-11 w-full rounded-xl border bg-background px-3"><option value="">Select customer</option>{customers.map((row) => <option key={row.id} value={row.id}>{String(row.name)}</option>)}</select></label>
            <label className="text-sm font-medium">Receipt date *<input required type="date" value={form.receipt_date} onChange={(e) => setForm({ ...form, receipt_date: e.target.value })} className="mt-1 h-11 w-full rounded-xl border bg-background px-3" /></label>
            <label className="text-sm font-medium">Amount *<input required min="0.01" step="0.01" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="mt-1 h-11 w-full rounded-xl border bg-background px-3" /></label>
            <label className="text-sm font-medium">Payment method *<select required value={form.payment_method_id} onChange={(e) => void selectPaymentMethod(e.target.value)} className="mt-1 h-11 w-full rounded-xl border bg-background px-3"><option value="">Select method</option>{methods.filter((row) => row.is_active !== false && ['inbound', 'both'].includes(String(row.payment_type))).map((row) => <option key={row.id} value={row.id}>{String(row.name)}</option>)}</select></label>
            <label className="text-sm font-medium">Cash / Bank journal<input readOnly value={selectedAccount ? `${selectedAccount.journal_name} (${selectedAccount.journal_code})` : ''} placeholder="Resolved from payment method" className="mt-1 h-11 w-full rounded-xl border bg-muted px-3" /></label>
            <label className="text-sm font-medium">Cash / Bank account *<select required value={form.cash_bank_account_id} onChange={(e) => selectAccount(e.target.value)} disabled={viewOnly || saving || !form.payment_method_id || paymentOptions.length === 1} className="mt-1 h-11 w-full rounded-xl border bg-background px-3 disabled:bg-muted"><option value="">{form.payment_method_id ? 'Select compatible account' : 'Select payment method first'}</option>{paymentOptions.map((row) => <option key={row.id} value={row.id}>{row.code} — {row.account_name}</option>)}</select></label>
            <label className="text-sm font-medium">Currency *<select required value={form.currency_id} onChange={(e) => { setPaymentOptions([]); setForm({ ...form, currency_id: e.target.value, payment_method_id: '', journal_id: '', cash_bank_account_id: '', allocations: [], exchange_rate: Number(e.target.value) === companyCurrencyId ? '1' : form.exchange_rate }); }} className="mt-1 h-11 w-full rounded-xl border bg-background px-3"><option value="">Select currency</option>{currencies.filter((row) => row.is_active !== false).map((row) => <option key={row.id} value={row.id}>{String(row.code)} — {String(row.name)}</option>)}</select></label>
            <label className="text-sm font-medium">Exchange rate *<input readOnly={Number(form.currency_id) === companyCurrencyId} required min="0.000001" step="0.000001" type="number" value={form.exchange_rate} onChange={(e) => setForm({ ...form, exchange_rate: e.target.value })} className="mt-1 h-11 w-full rounded-xl border bg-background px-3 read-only:bg-muted" /></label>
            <label className="text-sm font-medium">Reference<input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} className="mt-1 h-11 w-full rounded-xl border bg-background px-3" /></label>
            <label className="text-sm font-medium">Memo<input value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} className="mt-1 h-11 w-full rounded-xl border bg-background px-3" /></label>
          </fieldset>
          <div className="rounded-2xl border"><div className="flex items-center justify-between gap-4 border-b p-4"><div><h3 className="font-semibold">Invoice allocation</h3><p className="text-xs text-muted-foreground">Choose posted invoices and enter the amount paid.</p></div><button disabled={viewOnly || !form.amount || !openInvoices.length} type="button" onClick={autoAllocate} className="rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50">Auto Allocate</button><div className="text-right text-sm"><div>Receipt: <b>{money(form.amount)}</b></div><div>Allocated: <b>{money(allocated)}</b></div><div className={Math.abs(unallocated) > 0.005 ? 'text-amber-600' : 'text-emerald-600'}>Unallocated: <b>{money(unallocated)}</b></div></div></div>
            <div className="max-h-64 overflow-auto">{!form.customer_id ? <p className="p-6 text-center text-sm text-muted-foreground">Select a customer first.</p> : openInvoices.length === 0 ? <p className="p-6 text-center text-sm text-muted-foreground">No outstanding posted invoices found for this customer.</p> : openInvoices.map((invoice) => { const allocation = form.allocations.find((row) => row.invoice_id === invoice.id); return <div key={invoice.id} className="grid grid-cols-[auto_1.3fr_repeat(4,auto)] items-center gap-4 border-t p-3 text-sm"><input disabled={viewOnly} type="checkbox" checked={Boolean(allocation)} onChange={() => toggleInvoice(invoice)} /><div><b>{invoice.invoice_number}</b><p className="text-xs text-muted-foreground">Invoice {dateValue(invoice.invoice_date)} · Due {dateValue(invoice.due_date)}</p></div><div className="text-right">Total<br/><b>{money(invoice.amount_total, invoice.currencies?.code)}</b></div><div className="text-right">Previously paid<br/><b>{money(Number(invoice.amount_total) - Number(invoice.amount_due))}</b></div><div className="text-right">Outstanding<br/><b>{money(invoice.amount_due)}</b></div><input aria-label={`Amount to apply to ${invoice.invoice_number}`} disabled={!allocation || viewOnly} type="number" min="0.01" max={Number(invoice.amount_due)} step="0.01" value={allocation?.allocated_amount ?? ''} onChange={(e) => updateAllocation(invoice.id, e.target.value)} className="h-10 w-32 rounded-lg border px-3 text-right" /></div>; })}</div>
          </div>
          <DialogFooter><button type="button" onClick={() => setOpen(false)} className="rounded-xl border px-5 py-2.5">Close</button>{!viewOnly && <button disabled={saving || unallocated < -0.005} className="rounded-xl bg-primary px-5 py-2.5 font-semibold text-primary-foreground disabled:opacity-50">{saving ? 'Saving…' : 'Save draft receipt'}</button>}</DialogFooter>
        </form>
      </DialogContent></Dialog>
    </div>
  );
}
