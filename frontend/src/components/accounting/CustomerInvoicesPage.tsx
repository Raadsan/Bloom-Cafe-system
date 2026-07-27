'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Copy, Eye, Plus, Printer, RefreshCw, Send, Trash2, Edit3, X } from 'lucide-react';
import { customerInvoiceApi, type CustomerInvoice, type CustomerInvoiceLine } from '@/lib/api/accounting/receivables/customerInvoiceApi';
import { accountingCustomerApi } from '@/lib/api/accounting/receivables/customerApi';
import { accountingProductApi } from '@/lib/api/accounting/catalog/productApi';
import { accountingTaxApi } from '@/lib/api/accounting/configuration/taxApi';
import { currencyApi } from '@/lib/api/accounting/configuration/currencyApi';
import { paymentTermApi } from '@/lib/api/accounting/configuration/paymentTermApi';
import { companyApi } from '@/lib/api/accounting/configuration/companyApi';
import { accountingJournalApi } from '@/lib/api/accounting/ledger/journalApi';
import { chartOfAccountApi } from '@/lib/api/accounting/ledger/chartOfAccountApi';
import { fiscalPeriodApi } from '@/lib/api/accounting/ledger/fiscalPeriodApi';
import { useToast } from '@/components/ui/toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DashboardDataTable, { type DashboardTableColumn } from '@/components/shared/DashboardDataTable';
import { actionBtnDelete, actionBtnEdit, actionBtnView, btnCreatePage, dashboardSelectClass, pageHeaderTitleClass, pageHeaderWrapperClass } from '@/lib/dashboard-ui';

type Row = { id: number; [key: string]: unknown };
type Line = Omit<CustomerInvoiceLine, 'id' | 'products' | 'subtotal'>;
type Form = {
  customer_id: string; journal_id: string; fiscal_period_id: string; invoice_date: string; due_date: string;
  currency_id: string; exchange_rate: string; receivable_account_id: string; payment_term_id: string;
  customer_reference: string; notes: string; lines: Line[];
};
const today = () => new Date().toISOString().slice(0, 10);
const emptyLine = (): Line => ({ product_id: null, description: '', quantity: 1, unit_price: 0, discount_percent: 0, tax_id: null, income_account_id: 0 });
const emptyForm = (): Form => ({ customer_id: '', journal_id: '', fiscal_period_id: '', invoice_date: today(), due_date: today(), currency_id: '', exchange_rate: '1', receivable_account_id: '', payment_term_id: '', customer_reference: '', notes: '', lines: [emptyLine()] });
const apiDate = (value: string) => new Date(`${value}T00:00:00.000Z`).toISOString();
const dateValue = (value: unknown) => value ? new Date(String(value)).toISOString().slice(0, 10) : '';
const money = (value: unknown, code = '') => `${code ? `${code} ` : ''}${Number(value || 0).toFixed(2)}`;
const errorMessage = (error: unknown) => axios.isAxiosError(error) ? error.response?.data?.message || error.message : error instanceof Error ? error.message : 'Something went wrong';

export default function CustomerInvoicesPage() {
  const { showToast } = useToast();
  const [invoices, setInvoices] = useState<CustomerInvoice[]>([]);
  const [customers, setCustomers] = useState<Row[]>([]);
  const [products, setProducts] = useState<Row[]>([]);
  const [taxes, setTaxes] = useState<Row[]>([]);
  const [currencies, setCurrencies] = useState<Row[]>([]);
  const [journals, setJournals] = useState<Row[]>([]);
  const [accounts, setAccounts] = useState<Row[]>([]);
  const [periods, setPeriods] = useState<Row[]>([]);
  const [terms, setTerms] = useState<Row[]>([]);
  const [companies, setCompanies] = useState<Row[]>([]);
  const [form, setForm] = useState<Form>(emptyForm);
  const [selected, setSelected] = useState<CustomerInvoice | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currencyFilter, setCurrencyFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [viewOnly, setViewOnly] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [invoiceRows, customerRows, productRows, taxRows, currencyRows, journalRows, accountRows, periodRows, termRows, companyRows] = await Promise.all([
        customerInvoiceApi.getAll(), accountingCustomerApi.getAll(), accountingProductApi.getAll(), accountingTaxApi.getAll(),
        currencyApi.getAll(), accountingJournalApi.getAll(), chartOfAccountApi.getAll(), fiscalPeriodApi.getAll(), paymentTermApi.getAll(), companyApi.getAll(),
      ]);
      setInvoices(invoiceRows); setCustomers(customerRows); setProducts(productRows); setTaxes(taxRows); setCurrencies(currencyRows);
      setJournals(journalRows); setAccounts(accountRows); setPeriods(periodRows); setTerms(termRows);
      setCompanies(companyRows);
    } catch (error) { showToast(errorMessage(error), 'error'); } finally { setLoading(false); }
  }, [showToast]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  const customer = customers.find((item) => item.id === Number(form.customer_id));
  const companyId = Number(customer?.company_id || 0);
  const company = companies.find((item) => item.id === companyId);
  const companyJournals = journals.filter((item) => !companyId || Number(item.company_id) === companyId);
  const companyAccounts = accounts.filter((item) => !companyId || Number(item.company_id) === companyId);
  const totals = useMemo(() => form.lines.reduce((sum, line) => {
    const gross = Number(line.quantity || 0) * Number(line.unit_price || 0);
    const discounted = gross * (1 - Number(line.discount_percent || 0) / 100);
    const tax = taxes.find((item) => item.id === Number(line.tax_id));
    const rate = Number(tax?.rate_percent || 0) / 100;
    const untaxed = tax?.price_includes_tax && rate ? discounted / (1 + rate) : discounted;
    const taxAmount = tax ? (tax.price_includes_tax ? discounted - untaxed : untaxed * rate) : 0;
    return { untaxed: sum.untaxed + untaxed, discount: sum.discount + gross - discounted, tax: sum.tax + taxAmount, total: sum.total + untaxed + taxAmount };
  }, { untaxed: 0, discount: 0, tax: 0, total: 0 }), [form.lines, taxes]);

  const filtered = invoices.filter((invoice) => {
    const needle = query.trim().toLowerCase();
    const searchable = !needle || [invoice.invoice_number, invoice.customers?.name, invoice.state, invoice.payment_state].some((value) => String(value || '').toLowerCase().includes(needle));
    const effectiveStatus = invoice.state === 'cancelled' ? 'cancelled' : invoice.payment_state === 'paid' ? 'paid' : invoice.payment_state === 'partial' ? 'partial' : invoice.state;
    const invoiceDay = dateValue(invoice.invoice_date);
    return searchable &&
      (statusFilter === 'all' || effectiveStatus === statusFilter) &&
      (currencyFilter === 'all' || Number(invoice.currency_id) === Number(currencyFilter)) &&
      (customerFilter === 'all' || Number(invoice.customer_id) === Number(customerFilter)) &&
      (!dateFrom || invoiceDay >= dateFrom) && (!dateTo || invoiceDay <= dateTo);
  });

  function createInvoice() {
    setSelected(null);
    setViewOnly(false);
    const next = emptyForm();
    if (currencies.length === 1) next.currency_id = String(currencies[0].id);
    const immediate = terms.find((item) => /immediate/i.test(String(item.name)));
    if (immediate) next.payment_term_id = String(immediate.id);
    setForm(next); setOpen(true);
  }
  function editInvoice(invoice: CustomerInvoice) {
    setSelected(invoice);
    setViewOnly(invoice.state !== 'draft');
    setForm({
      customer_id: String(invoice.customer_id), journal_id: String(invoice.journal_id || ''), fiscal_period_id: String(invoice.fiscal_period_id || ''),
      invoice_date: dateValue(invoice.invoice_date), due_date: dateValue(invoice.due_date), currency_id: String(invoice.currency_id || ''),
      exchange_rate: String(invoice.exchange_rate || 1), receivable_account_id: String(invoice.receivable_account_id || ''),
      payment_term_id: String(invoice.payment_term_id || ''), customer_reference: String(invoice.customer_reference || ''), notes: String(invoice.notes || ''),
      lines: (invoice.customer_invoice_lines || []).map((line) => ({ product_id: line.product_id || null, description: line.description, quantity: Number(line.quantity), unit_price: Number(line.unit_price), discount_percent: Number(line.discount_percent), tax_id: line.tax_id || null, income_account_id: Number(line.income_account_id) })),
    });
    setOpen(true);
  }
  function selectCustomer(value: string) {
    const nextCustomer = customers.find((item) => item.id === Number(value));
    const nextCompanyId = Number(nextCustomer?.company_id || 0);
    const invoiceJournal = journals.find((item) => Number(item.company_id) === nextCompanyId && String(item.code).toUpperCase() === 'INV');
    const arAccount = accounts.find((item) => Number(item.company_id) === nextCompanyId && String(item.code) === '1100');
    const nextCompany = companies.find((item) => item.id === nextCompanyId);
    const termId = nextCustomer?.payment_term_id || terms.find((item) => /immediate/i.test(String(item.name)))?.id || '';
    const due = new Date(`${form.invoice_date}T00:00:00.000Z`); due.setUTCDate(due.getUTCDate() + paymentDays(String(termId)));
    setForm((current) => ({ ...current, customer_id: value, journal_id: invoiceJournal ? String(invoiceJournal.id) : '', receivable_account_id: arAccount ? String(arAccount.id) : '', currency_id: nextCompany ? String(nextCompany.currency_id) : current.currency_id, exchange_rate: '1', payment_term_id: String(termId), due_date: due.toISOString().slice(0, 10) }));
  }
  function paymentDays(termId: string) {
    const name = String(terms.find((item) => item.id === Number(termId))?.name || '');
    if (/immediate/i.test(name)) return 0;
    return Number(name.match(/\d+/)?.[0] || 0);
  }
  function setPaymentTerm(value: string) {
    const due = new Date(`${form.invoice_date}T00:00:00.000Z`);
    due.setUTCDate(due.getUTCDate() + paymentDays(value));
    setForm({ ...form, payment_term_id: value, due_date: due.toISOString().slice(0, 10) });
  }
  function setInvoiceDate(value: string) {
    const nextPeriod = periods.find((item) => String(item.state) === 'open' && dateValue(item.start_date) <= value && dateValue(item.end_date) >= value);
    const due = new Date(`${value}T00:00:00.000Z`); due.setUTCDate(due.getUTCDate() + paymentDays(form.payment_term_id));
    setForm({ ...form, invoice_date: value, due_date: due.toISOString().slice(0, 10), fiscal_period_id: nextPeriod ? String(nextPeriod.id) : '' });
  }
  function updateLine(index: number, patch: Partial<Line>) {
    setForm((current) => ({ ...current, lines: current.lines.map((line, lineIndex) => lineIndex === index ? { ...line, ...patch } : line) }));
  }
  function chooseProduct(index: number, value: string) {
    const product = products.find((item) => item.id === Number(value));
    updateLine(index, product ? { product_id: product.id, description: String(product.name), unit_price: Number(product.list_price || 0), income_account_id: Number(product.income_account_id || 0), tax_id: Number(product.sale_tax_id) || null } : { product_id: null });
  }
  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true);
    const payload = {
      ...form, customer_id: Number(form.customer_id), journal_id: Number(form.journal_id), fiscal_period_id: form.fiscal_period_id ? Number(form.fiscal_period_id) : null,
      invoice_date: apiDate(form.invoice_date), due_date: form.due_date ? apiDate(form.due_date) : null, currency_id: Number(form.currency_id),
      exchange_rate: Number(form.exchange_rate), receivable_account_id: Number(form.receivable_account_id), payment_term_id: form.payment_term_id ? Number(form.payment_term_id) : null,
    };
    try {
      if (selected) await customerInvoiceApi.update(selected.id, payload); else await customerInvoiceApi.create(payload);
      showToast(`Draft invoice ${selected ? 'updated' : 'created'} successfully`, 'success'); setOpen(false); await load();
    } catch (error) { showToast(errorMessage(error), 'error'); } finally { setSaving(false); }
  }
  async function remove(invoice: CustomerInvoice) {
    if (!window.confirm(`Delete draft invoice ${invoice.invoice_number}?`)) return;
    try { await customerInvoiceApi.remove(invoice.id); showToast('Draft invoice deleted successfully', 'success'); await load(); }
    catch (error) { showToast(errorMessage(error), 'error'); }
  }
  async function postInvoice(invoice: CustomerInvoice) {
    if (!window.confirm(`Post ${invoice.invoice_number}? This will post its journal entry and lock the invoice.`)) return;
    try { await customerInvoiceApi.post(invoice.id); showToast('Invoice and journal entry posted successfully', 'success'); await load(); }
    catch (error) { showToast(errorMessage(error), 'error'); }
  }
  function duplicate(invoice: CustomerInvoice) {
    editInvoice(invoice);
    setSelected(null); setViewOnly(false);
    setForm((current) => ({ ...current, invoice_date: today(), due_date: today() }));
  }
  const columns: DashboardTableColumn<CustomerInvoice>[] = [
    { key: 'number', header: 'Invoice', cell: (row) => <span className="font-bold text-primary">{row.invoice_number}</span> },
    { key: 'customer', header: 'Customer', cell: (row) => row.customers?.name || `#${row.customer_id}` },
    { key: 'date', header: 'Invoice Date', cell: (row) => dateValue(row.invoice_date) },
    { key: 'due', header: 'Due Date', cell: (row) => dateValue(row.due_date) },
    { key: 'currency', header: 'Currency', cell: (row) => row.currencies?.code || '—' },
    { key: 'status', header: 'Status', align: 'center', cell: (row) => <Status invoice={row} /> },
    { key: 'subtotal', header: 'Subtotal', align: 'right', cell: (row) => money(row.amount_untaxed) },
    { key: 'tax', header: 'Tax', align: 'right', cell: (row) => money(row.amount_tax) },
    { key: 'total', header: 'Total', align: 'right', cell: (row) => <span className="font-semibold">{money(row.amount_total)}</span> },
    { key: 'outstanding', header: 'Outstanding', align: 'right', cell: (row) => money(row.amount_due) },
    { key: 'actions', header: 'Actions', align: 'right', cell: (row) => <div className="flex justify-end gap-1">{row.state === 'draft' ? <><button title="Edit" onClick={() => editInvoice(row)} className={actionBtnEdit}><Edit3 className="size-4" /></button><button title="Post" onClick={() => void postInvoice(row)} className={actionBtnView}><Send className="size-4" /></button><button title="Delete" onClick={() => void remove(row)} className={actionBtnDelete}><Trash2 className="size-4" /></button></> : <><button title="View" onClick={() => editInvoice(row)} className={actionBtnView}><Eye className="size-4" /></button><button title="Print" onClick={() => window.print()} className={actionBtnView}><Printer className="size-4" /></button><button title="Duplicate" onClick={() => duplicate(row)} className={actionBtnView}><Copy className="size-4" /></button></>}</div> },
  ];

  return <main className="dashboard-scope space-y-5 p-4 sm:p-6 lg:p-8">
    <div className={pageHeaderWrapperClass}><p className="text-xs font-bold uppercase tracking-[.2em] text-primary">Receivables</p><h1 className={pageHeaderTitleClass}>Customer Invoices</h1><p className="mt-1 text-sm text-muted-foreground">Prepare and manage customer sales invoices.</p></div>
    <DashboardDataTable rows={filtered} columns={columns} loading={loading} searchValue={query} onSearchChange={setQuery} searchPlaceholder="Search invoices..." emptyText="No customer invoices found" minWidth="1350px" action={<button onClick={createInvoice} className={btnCreatePage}><Plus className="size-4" /> New invoice</button>} filters={<><select value={customerFilter} onChange={(event) => setCustomerFilter(event.target.value)} className={dashboardSelectClass}><option value="all">All customers</option>{customers.map((item) => <option key={item.id} value={item.id}>{String(item.name)}</option>)}</select><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={dashboardSelectClass}><option value="all">All statuses</option><option value="draft">Draft</option><option value="posted">Posted</option><option value="partial">Partially paid</option><option value="paid">Paid</option><option value="cancelled">Cancelled</option></select><select value={currencyFilter} onChange={(event) => setCurrencyFilter(event.target.value)} className={dashboardSelectClass}><option value="all">All currencies</option>{currencies.map((item) => <option key={item.id} value={item.id}>{String(item.code)}</option>)}</select><input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className={dashboardSelectClass} /><input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className={dashboardSelectClass} /><button onClick={() => void load()} className="flex size-[42px] items-center justify-center rounded-md border"><RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} /></button></>} />
    <Dialog open={open} onOpenChange={(value) => !saving && setOpen(value)}><DialogContent className="max-h-[94vh] max-w-[calc(100vw-2rem)] overflow-y-auto xl:max-w-[1240px]"><DialogHeader><DialogTitle>{viewOnly ? 'View' : selected ? 'Edit' : 'Prepare'} customer invoice</DialogTitle><DialogDescription>{viewOnly ? 'Posted invoices are read-only.' : 'Saving creates a draft invoice and a linked draft journal entry. Nothing is posted automatically.'}</DialogDescription></DialogHeader><form onSubmit={save} className="space-y-5"><fieldset disabled={viewOnly} className="contents">
      <div className="grid gap-3 rounded-xl border bg-muted/20 p-3 sm:grid-cols-3"><div><p className="text-[10px] font-semibold uppercase text-muted-foreground">Invoice number</p><p className="mt-1 text-sm font-bold">{selected?.invoice_number || 'Auto (INV####)'}</p></div><div><p className="text-[10px] font-semibold uppercase text-muted-foreground">Status</p><div className="mt-1">{selected ? <Status invoice={selected} /> : <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-semibold text-zinc-700">DRAFT</span>}</div></div><div><p className="text-[10px] font-semibold uppercase text-muted-foreground">Company</p><p className="mt-1 text-sm font-semibold">{String(company?.name || 'Selected from customer')}</p></div></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Select label="Customer" value={form.customer_id} set={selectCustomer} rows={customers} />
        <Select label="Journal (INV)" value={form.journal_id} set={() => {}} rows={companyJournals} disabled />
        <Select label="Currency" value={form.currency_id} set={(value) => setForm({ ...form, currency_id: value })} rows={currencies} labelKey="code" />
        <Select label="Receivable account" value={form.receivable_account_id} set={() => {}} rows={companyAccounts} account disabled />
        <Field label="Invoice date" type="date" value={form.invoice_date} set={setInvoiceDate} />
        <Field label="Due date" type="date" value={form.due_date} set={() => {}} disabled />
        <Select label="Fiscal period" value={form.fiscal_period_id} set={() => {}} rows={periods} optional disabled />
        <Select label="Payment term" value={form.payment_term_id} set={setPaymentTerm} rows={terms} optional />
        <Field label="Company" value={String(company?.name || '')} set={() => {}} optional disabled />
        <Field label="Customer reference" value={form.customer_reference} set={(value) => setForm({ ...form, customer_reference: value })} optional />
        <Field label="Exchange rate" type="number" value={form.exchange_rate} set={(value) => setForm({ ...form, exchange_rate: value })} disabled={Number(form.currency_id) === Number(company?.currency_id)} />
      </div>
      {customer && <div className="rounded-xl border p-3 text-xs text-muted-foreground"><span className="font-semibold text-foreground">{String(customer.customer_code || 'No code')} — {String(customer.name)}</span><span className="ml-3">{String(customer.phone || 'No phone')}</span><span className="ml-3">{String(customer.email || 'No email')}</span>{Boolean(customer.address) && <p className="mt-1">Billing address: {String(customer.address)}</p>}</div>}
      <div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[1100px] text-xs"><thead className="bg-muted/50"><tr><th className="p-3 text-left">Product</th><th className="p-3 text-left">Description</th><th className="p-3">Qty</th><th className="p-3">Unit price</th><th className="p-3">Discount %</th><th className="p-3">Tax</th><th className="p-3">Income account</th><th className="p-3 text-right">Line total</th><th className="w-10"></th></tr></thead><tbody>{form.lines.map((line, index) => <tr key={index} className="border-t">
        <td className="p-2"><select value={line.product_id || ''} onChange={(event) => chooseProduct(index, event.target.value)} className="h-9 w-40 rounded-lg border px-2"><option value="">Custom line</option>{products.filter((item) => item.can_be_sold !== false).map((item) => <option key={item.id} value={item.id}>{String(item.name)}</option>)}</select></td>
        <td className="p-2"><input required value={line.description} onChange={(event) => updateLine(index, { description: event.target.value })} className="h-9 w-full min-w-52 rounded-lg border px-2" /></td>
        <td className="p-2"><input required type="number" min="0.0001" step="0.0001" value={line.quantity} onChange={(event) => updateLine(index, { quantity: Number(event.target.value) })} className="h-9 w-20 rounded-lg border px-2" /></td>
        <td className="p-2"><input required type="number" min="0" step="0.01" value={line.unit_price} onChange={(event) => updateLine(index, { unit_price: Number(event.target.value) })} className="h-9 w-28 rounded-lg border px-2" /></td>
        <td className="p-2"><input type="number" min="0" max="100" step="0.01" value={line.discount_percent} onChange={(event) => updateLine(index, { discount_percent: Number(event.target.value) })} className="h-9 w-20 rounded-lg border px-2" /></td>
        <td className="p-2"><select value={line.tax_id || ''} onChange={(event) => updateLine(index, { tax_id: Number(event.target.value) || null })} className="h-9 w-32 rounded-lg border px-2"><option value="">No tax</option>{taxes.filter((item) => item.is_active !== false).map((item) => <option key={item.id} value={item.id}>{String(item.name)}</option>)}</select></td>
        <td className="p-2"><select disabled={Boolean(line.product_id)} required value={line.income_account_id || ''} onChange={(event) => updateLine(index, { income_account_id: Number(event.target.value) })} className="h-9 w-48 rounded-lg border px-2 disabled:bg-muted"><option value="">Select account</option>{companyAccounts.map((item) => <option key={item.id} value={item.id}>{String(item.code)} — {String(item.name)}</option>)}</select></td>
        <td className="p-2 text-right font-semibold">{(Number(line.quantity) * Number(line.unit_price) * (1 - Number(line.discount_percent) / 100)).toFixed(2)}</td>
        <td className="p-2"><button type="button" disabled={form.lines.length === 1} onClick={() => setForm({ ...form, lines: form.lines.filter((_, lineIndex) => lineIndex !== index) })} className="rounded p-1 text-rose-600 disabled:opacity-30"><X className="size-4" /></button></td>
      </tr>)}</tbody></table><button type="button" onClick={() => setForm({ ...form, lines: [...form.lines, emptyLine()] })} className="m-3 flex items-center gap-1 text-xs font-semibold text-primary"><Plus className="size-3" /> Add line</button></div>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]"><label className="text-xs font-semibold">Notes<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={4} className="mt-1.5 w-full rounded-xl border p-3 text-sm" /></label><div className="rounded-xl border bg-muted/20 p-4 text-sm"><Total label="Subtotal" value={totals.untaxed + totals.discount} /><Total label="Discount" value={totals.discount} /><Total label="Tax" value={totals.tax} /><div className="my-2 border-t" /><Total label="Grand total" value={totals.total} strong /></div></div>
      </fieldset><DialogFooter><button type="button" onClick={() => setOpen(false)} className="h-10 rounded-xl border px-5">{viewOnly ? 'Close' : 'Cancel'}</button>{!viewOnly && <button disabled={saving} className="h-10 rounded-xl bg-primary px-5 font-semibold text-white">{saving ? 'Saving...' : 'Save draft invoice'}</button>}</DialogFooter>
    </form></DialogContent></Dialog>
  </main>;
}

function Select({ label, value, set, rows, labelKey = 'name', optional, account, disabled }: { label: string; value: string; set: (value: string) => void; rows: Row[]; labelKey?: string; optional?: boolean; account?: boolean; disabled?: boolean }) {
  return <label className="text-xs font-semibold">{label}{!optional && <span className="text-rose-500"> *</span>}<select disabled={disabled} required={!optional} value={value} onChange={(event) => set(event.target.value)} className="mt-1.5 h-10 w-full rounded-xl border bg-background px-3 text-sm disabled:bg-muted"><option value="">Select {label.toLowerCase()}</option>{rows.map((row) => <option key={row.id} value={row.id}>{account ? `${String(row.code || '')} — ${String(row.name || '')}` : String(row[labelKey] || row.name || '')}</option>)}</select></label>;
}
function Field({ label, value, set, type = 'text', optional, disabled }: { label: string; value: string; set: (value: string) => void; type?: string; optional?: boolean; disabled?: boolean }) {
  return <label className="text-xs font-semibold">{label}{!optional && <span className="text-rose-500"> *</span>}<input disabled={disabled} required={!optional} type={type} step={type === 'number' ? '0.000001' : undefined} min={type === 'number' ? '0.000001' : undefined} value={value} onChange={(event) => set(event.target.value)} className="mt-1.5 h-10 w-full rounded-xl border bg-background px-3 text-sm disabled:bg-muted" /></label>;
}
function Total({ label, value, strong }: { label: string; value: number; strong?: boolean }) { return <div className={`flex justify-between py-1 ${strong ? 'text-base font-bold' : ''}`}><span>{label}</span><span>{value.toFixed(2)}</span></div>; }
function Status({ invoice }: { invoice: CustomerInvoice }) {
  const key = invoice.state === 'cancelled' ? 'cancelled' : invoice.payment_state === 'paid' ? 'paid' : invoice.payment_state === 'partial' ? 'partial' : invoice.state;
  const styles: Record<string, string> = { draft: 'bg-zinc-100 text-zinc-700', posted: 'bg-blue-50 text-blue-700', partial: 'bg-orange-50 text-orange-700', paid: 'bg-emerald-50 text-emerald-700', cancelled: 'bg-rose-50 text-rose-700' };
  const labels: Record<string, string> = { draft: 'DRAFT', posted: 'POSTED', partial: 'PARTIALLY PAID', paid: 'PAID', cancelled: 'CANCELLED' };
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${styles[key] || styles.draft}`}>{labels[key] || key.toUpperCase()}</span>;
}
