'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Edit3, Eye, Plus, RefreshCw, Send, Trash2, X } from 'lucide-react';
import { vendorBillApi, vendorRefundApi, type VendorBill, type VendorBillLine } from '@/lib/api/accounting/payables/vendorBillApi';
import { vendorApi } from '@/lib/api/accounting/payables/vendorApi';
import { accountingProductApi } from '@/lib/api/accounting/catalog/productApi';
import { accountingTaxApi } from '@/lib/api/accounting/configuration/taxApi';
import { currencyApi } from '@/lib/api/accounting/configuration/currencyApi';
import { paymentTermApi } from '@/lib/api/accounting/configuration/paymentTermApi';
import { companyApi } from '@/lib/api/accounting/configuration/companyApi';
import { chartOfAccountApi } from '@/lib/api/accounting/ledger/chartOfAccountApi';
import { useToast } from '@/components/ui/toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DashboardDataTable, { type DashboardTableColumn } from '@/components/shared/DashboardDataTable';
import { actionBtnDelete, actionBtnEdit, actionBtnView, btnCreatePage, dashboardSelectClass, pageHeaderTitleClass, pageHeaderWrapperClass } from '@/lib/dashboard-ui';

type Row = { id: number; [key: string]: unknown };
type Line = Omit<VendorBillLine, 'id' | 'subtotal'>;
type Form = {
  vendor_id: string; reversed_bill_id: string; bill_date: string; received_date: string; currency_id: string; exchange_rate: string;
  payment_term_id: string; vendor_reference: string; notes: string; lines: Line[];
};
const today = () => new Date().toISOString().slice(0, 10);
const emptyLine = (): Line => ({ product_id: null, description: '', quantity: 1, unit_price: 0, discount_percent: 0, tax_id: null, expense_account_id: 0 });
const emptyForm = (): Form => ({ vendor_id: '', reversed_bill_id: '', bill_date: today(), received_date: today(), currency_id: '', exchange_rate: '1', payment_term_id: '', vendor_reference: '', notes: '', lines: [emptyLine()] });
const dateValue = (value: unknown) => value ? new Date(String(value)).toISOString().slice(0, 10) : '';
const apiDate = (value: string) => new Date(`${value}T00:00:00.000Z`).toISOString();
const money = (value: unknown) => Number(value || 0).toFixed(2);
const errorMessage = (error: unknown) => axios.isAxiosError(error) ? error.response?.data?.message || error.message : error instanceof Error ? error.message : 'Something went wrong';

export default function VendorBillsPage({ kind = 'bill' }: { kind?: 'bill' | 'refund' }) {
  const isRefund = kind === 'refund';
  const recordsApi = isRefund ? vendorRefundApi : vendorBillApi;
  const { showToast } = useToast();
  const [bills, setBills] = useState<VendorBill[]>([]);
  const [sourceBills, setSourceBills] = useState<VendorBill[]>([]);
  const [vendors, setVendors] = useState<Row[]>([]);
  const [products, setProducts] = useState<Row[]>([]);
  const [taxes, setTaxes] = useState<Row[]>([]);
  const [currencies, setCurrencies] = useState<Row[]>([]);
  const [terms, setTerms] = useState<Row[]>([]);
  const [companies, setCompanies] = useState<Row[]>([]);
  const [accounts, setAccounts] = useState<Row[]>([]);
  const [form, setForm] = useState<Form>(emptyForm);
  const [selected, setSelected] = useState<VendorBill | null>(null);
  const [open, setOpen] = useState(false);
  const [viewOnly, setViewOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [billRows, sourceRows, vendorRows, productRows, taxRows, currencyRows, termRows, companyRows, accountRows] = await Promise.all([
        recordsApi.getAll(), isRefund ? vendorBillApi.getAll() : Promise.resolve([]), vendorApi.getAll(), accountingProductApi.getAll(), accountingTaxApi.getAll(),
        currencyApi.getAll(), paymentTermApi.getAll(), companyApi.getAll(), chartOfAccountApi.getAll(),
      ]);
      setBills(billRows); setSourceBills(sourceRows); setVendors(vendorRows); setProducts(productRows); setTaxes(taxRows);
      setCurrencies(currencyRows); setTerms(termRows); setCompanies(companyRows); setAccounts(accountRows);
    } catch (error) { showToast(errorMessage(error), 'error'); } finally { setLoading(false); }
  }, [showToast, recordsApi, isRefund]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  const vendor = vendors.find((row) => row.id === Number(form.vendor_id));
  const company = companies.find((row) => row.id === Number(vendor?.company_id));
  const companyAccounts = accounts.filter((row) => !vendor || Number(row.company_id) === Number(vendor.company_id));
  const totals = useMemo(() => form.lines.reduce((sum, line) => {
    const gross = Number(line.quantity) * Number(line.unit_price);
    const discounted = gross * (1 - Number(line.discount_percent) / 100);
    const tax = taxes.find((row) => row.id === Number(line.tax_id));
    const rate = Number(tax?.rate_percent || 0) / 100;
    const untaxed = tax?.price_includes_tax && rate ? discounted / (1 + rate) : discounted;
    const taxAmount = tax ? (tax.price_includes_tax ? discounted - untaxed : untaxed * rate) : 0;
    return { subtotal: sum.subtotal + untaxed, tax: sum.tax + taxAmount, total: sum.total + untaxed + taxAmount };
  }, { subtotal: 0, tax: 0, total: 0 }), [form.lines, taxes]);
  const filtered = bills.filter((bill) => {
    const needle = query.trim().toLowerCase();
    return (!needle || [bill.bill_number, bill.vendor_reference, bill.vendors?.name, bill.state].some((value) => String(value || '').toLowerCase().includes(needle))) &&
      (vendorFilter === 'all' || bill.vendor_id === Number(vendorFilter)) &&
      (statusFilter === 'all' || bill.state === statusFilter);
  });

  function prepareBill() {
    const next = emptyForm();
    if (currencies.length === 1) next.currency_id = String(currencies[0].id);
    const immediate = terms.find((row) => /immediate/i.test(String(row.name)));
    if (immediate) next.payment_term_id = String(immediate.id);
    setSelected(null); setViewOnly(false); setForm(next); setOpen(true);
  }
  function openBill(bill: VendorBill, readonly = false) {
    setSelected(bill); setViewOnly(readonly || bill.state !== 'draft');
    setForm({
      vendor_id: String(bill.vendor_id), reversed_bill_id: String(bill.reversed_bill_id || ''), bill_date: dateValue(bill.bill_date), received_date: dateValue(bill.received_date),
      currency_id: String(bill.currency_id || ''), exchange_rate: String(bill.exchange_rate || 1),
      payment_term_id: String(bill.payment_term_id || ''), vendor_reference: String(bill.vendor_reference || ''),
      notes: String(bill.notes || ''), lines: (bill.vendor_bill_lines || []).map((line) => ({
        product_id: line.product_id || null, description: line.description, quantity: Number(line.quantity),
        unit_price: Number(line.unit_price), discount_percent: Number(line.discount_percent),
        tax_id: line.tax_id || null, expense_account_id: Number(line.expense_account_id),
      })),
    });
    setOpen(true);
  }
  function selectVendor(value: string) {
    const nextVendor = vendors.find((row) => row.id === Number(value));
    const nextCompany = companies.find((row) => row.id === Number(nextVendor?.company_id));
    setForm((current) => ({
      ...current, vendor_id: value, currency_id: String(nextVendor?.currency_id || nextCompany?.currency_id || current.currency_id),
      payment_term_id: String(nextVendor?.payment_term_id || current.payment_term_id), exchange_rate: '1',
      lines: current.lines.map((line) => ({ ...line, expense_account_id: Number(nextVendor?.expense_account_id || line.expense_account_id) })),
    }));
  }
  function updateLine(index: number, patch: Partial<Line>) {
    setForm((current) => ({ ...current, lines: current.lines.map((line, lineIndex) => lineIndex === index ? { ...line, ...patch } : line) }));
  }
  function chooseProduct(index: number, value: string) {
    const product = products.find((row) => row.id === Number(value));
    updateLine(index, product ? {
      product_id: product.id, description: String(product.name), unit_price: Number(product.standard_cost || 0),
      expense_account_id: Number(product.expense_account_id || 0), tax_id: Number(product.purchase_tax_id) || null,
    } : { product_id: null });
  }
  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true);
    const payload = {
      ...form, vendor_id: Number(form.vendor_id), bill_date: apiDate(form.bill_date),
      received_date: form.received_date ? apiDate(form.received_date) : null, currency_id: Number(form.currency_id),
      exchange_rate: Number(form.exchange_rate), payment_term_id: form.payment_term_id ? Number(form.payment_term_id) : null,
      reversed_bill_id: form.reversed_bill_id ? Number(form.reversed_bill_id) : null,
    };
    try {
      if (selected) await recordsApi.update(selected.id, payload); else await recordsApi.create(payload);
      showToast(`Draft vendor ${kind} ${selected ? 'updated' : 'prepared'} successfully`, 'success'); setOpen(false); await load();
    } catch (error) { showToast(errorMessage(error), 'error'); } finally { setSaving(false); }
  }
  async function remove(bill: VendorBill) {
    if (!window.confirm(`Delete draft vendor bill ${bill.bill_number}?`)) return;
    try { await recordsApi.remove(bill.id); showToast(`Draft vendor ${kind} deleted`, 'success'); await load(); }
    catch (error) { showToast(errorMessage(error), 'error'); }
  }
  async function postRecord(bill: VendorBill) {
    if (!window.confirm(`Post ${bill.bill_number}? This will lock the ${kind}.`)) return;
    try { await recordsApi.post(bill.id); showToast(`Vendor ${kind} posted successfully`, 'success'); await load(); }
    catch (error) { showToast(errorMessage(error), 'error'); }
  }

  const columns: DashboardTableColumn<VendorBill>[] = [
    { key: 'number', header: 'Bill', cell: (row) => <span className="font-bold text-primary">{row.bill_number}</span> },
    { key: 'vendor', header: 'Vendor', cell: (row) => row.vendors?.name || `#${row.vendor_id}` },
    { key: 'reference', header: 'Vendor Reference', cell: (row) => String(row.vendor_reference || '—') },
    { key: 'date', header: 'Bill Date', cell: (row) => dateValue(row.bill_date) },
    { key: 'due', header: 'Due Date', cell: (row) => dateValue(row.due_date) },
    { key: 'status', header: 'Status', align: 'center', cell: (row) => <Status bill={row} /> },
    { key: 'total', header: 'Total', align: 'right', cell: (row) => <span className="font-semibold">{row.currencies?.code} {money(row.amount_total)}</span> },
    { key: 'dueAmount', header: 'Amount Due', align: 'right', cell: (row) => money(row.amount_due) },
    { key: 'actions', header: 'Actions', align: 'right', cell: (row) => <div className="flex justify-end gap-1">
      {row.state === 'draft' ? <><button title="Edit" onClick={() => openBill(row)} className={actionBtnEdit}><Edit3 className="size-4" /></button><button title="Post" onClick={() => void postRecord(row)} className={actionBtnView}><Send className="size-4" /></button><button title="Delete" onClick={() => void remove(row)} className={actionBtnDelete}><Trash2 className="size-4" /></button></> : <button title="View" onClick={() => openBill(row, true)} className={actionBtnView}><Eye className="size-4" /></button>}
    </div> },
  ];

  return <main className="dashboard-scope space-y-5 p-4 sm:p-6 lg:p-8">
    <div className={pageHeaderWrapperClass}><p className="text-xs font-bold uppercase tracking-[.2em] text-primary">Payables</p><h1 className={pageHeaderTitleClass}>{isRefund ? 'Vendor Refunds' : 'Vendor Bills'}</h1><p className="mt-1 text-sm text-muted-foreground">{isRefund ? 'Record vendor credits and refunds against posted bills.' : 'Prepare and manage bills received from your vendors.'}</p></div>
    <DashboardDataTable rows={filtered} columns={columns} loading={loading} searchValue={query} onSearchChange={setQuery} searchPlaceholder={`Search vendor ${isRefund ? 'refunds' : 'bills'}...`} emptyText={`No vendor ${isRefund ? 'refunds' : 'bills'} found`} minWidth="1100px" action={<button onClick={prepareBill} className={btnCreatePage}><Plus className="size-4" /> Prepare {isRefund ? 'refund' : 'bill'}</button>} filters={<>
      <select value={vendorFilter} onChange={(event) => setVendorFilter(event.target.value)} className={dashboardSelectClass}><option value="all">All vendors</option>{vendors.map((row) => <option key={row.id} value={row.id}>{String(row.name)}</option>)}</select>
      <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={dashboardSelectClass}><option value="all">All statuses</option><option value="draft">Draft</option><option value="posted">Posted</option><option value="cancelled">Cancelled</option></select>
      <button onClick={() => void load()} className="flex size-[42px] items-center justify-center rounded-md border"><RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} /></button>
    </>} />
    <Dialog open={open} onOpenChange={(value) => !saving && setOpen(value)}><DialogContent className="max-h-[94vh] max-w-[calc(100vw-2rem)] overflow-y-auto xl:max-w-[1240px]"><DialogHeader><DialogTitle>{viewOnly ? 'View' : selected ? 'Edit' : 'Prepare'} vendor {kind}</DialogTitle><DialogDescription>{viewOnly ? `This ${kind} is read-only.` : `Enter the vendor document and lines. Saving prepares a draft ${kind}.`}</DialogDescription></DialogHeader>
      <form onSubmit={save} className="space-y-5"><fieldset disabled={viewOnly} className="contents">
        <div className="grid gap-3 rounded-xl border bg-muted/20 p-3 sm:grid-cols-3"><Summary label="Bill number" value={selected?.bill_number || 'Auto (BILL####)'} /><Summary label="Status" value={selected?.state || 'Draft'} /><Summary label="Company" value={String(company?.name || 'Selected from vendor')} /></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select label="Vendor" value={form.vendor_id} set={selectVendor} rows={vendors} />
          {isRefund && <Select label="Original bill" value={form.reversed_bill_id} set={(value) => setForm({ ...form, reversed_bill_id: value })} rows={sourceBills.filter((row) => row.vendor_id === Number(form.vendor_id) && row.state === 'posted')} labelKey="bill_number" optional />}
          <Field label="Vendor reference" value={form.vendor_reference} set={(value) => setForm({ ...form, vendor_reference: value })} optional />
          <Field label="Bill date" type="date" value={form.bill_date} set={(value) => setForm({ ...form, bill_date: value })} />
          <Field label="Received date" type="date" value={form.received_date} set={(value) => setForm({ ...form, received_date: value })} />
          <Select label="Payment term" value={form.payment_term_id} set={(value) => setForm({ ...form, payment_term_id: value })} rows={terms} optional />
          <Select label="Currency" value={form.currency_id} set={(value) => setForm({ ...form, currency_id: value })} rows={currencies} labelKey="code" />
          <Field label="Exchange rate" type="number" value={form.exchange_rate} set={(value) => setForm({ ...form, exchange_rate: value })} disabled={Number(form.currency_id) === Number(company?.currency_id)} />
        </div>
        {vendor && <div className="rounded-xl border p-3 text-xs text-muted-foreground"><span className="font-semibold text-foreground">{String(vendor.vendor_code || 'No code')} — {String(vendor.name)}</span><span className="ml-3">{String(vendor.phone || 'No phone')}</span><span className="ml-3">{String(vendor.email || 'No email')}</span></div>}
        <div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[1050px] text-xs"><thead className="bg-muted/50"><tr><th className="p-3 text-left">Product</th><th className="p-3 text-left">Description</th><th className="p-3">Qty</th><th className="p-3">Unit cost</th><th className="p-3">Discount %</th><th className="p-3">Tax</th><th className="p-3">Expense account</th><th className="p-3 text-right">Line total</th><th /></tr></thead><tbody>{form.lines.map((line, index) => <tr key={index} className="border-t">
          <td className="p-2"><select value={line.product_id || ''} onChange={(event) => chooseProduct(index, event.target.value)} className="h-9 w-40 rounded-lg border px-2"><option value="">Custom line</option>{products.filter((row) => row.can_be_purchased !== false).map((row) => <option key={row.id} value={row.id}>{String(row.name)}</option>)}</select></td>
          <td className="p-2"><input required value={line.description} onChange={(event) => updateLine(index, { description: event.target.value })} className="h-9 w-full min-w-52 rounded-lg border px-2" /></td>
          <td className="p-2"><input required type="number" min=".0001" step=".0001" value={line.quantity} onChange={(event) => updateLine(index, { quantity: Number(event.target.value) })} className="h-9 w-20 rounded-lg border px-2" /></td>
          <td className="p-2"><input required type="number" min="0" step=".01" value={line.unit_price} onChange={(event) => updateLine(index, { unit_price: Number(event.target.value) })} className="h-9 w-28 rounded-lg border px-2" /></td>
          <td className="p-2"><input type="number" min="0" max="100" step=".01" value={line.discount_percent} onChange={(event) => updateLine(index, { discount_percent: Number(event.target.value) })} className="h-9 w-20 rounded-lg border px-2" /></td>
          <td className="p-2"><select value={line.tax_id || ''} onChange={(event) => updateLine(index, { tax_id: Number(event.target.value) || null })} className="h-9 w-32 rounded-lg border px-2"><option value="">No tax</option>{taxes.filter((row) => row.is_active !== false).map((row) => <option key={row.id} value={row.id}>{String(row.name)}</option>)}</select></td>
          <td className="p-2"><select required value={line.expense_account_id || ''} onChange={(event) => updateLine(index, { expense_account_id: Number(event.target.value) })} className="h-9 w-48 rounded-lg border px-2"><option value="">Select account</option>{companyAccounts.map((row) => <option key={row.id} value={row.id}>{String(row.code)} — {String(row.name)}</option>)}</select></td>
          <td className="p-2 text-right font-semibold">{money(Number(line.quantity) * Number(line.unit_price) * (1 - Number(line.discount_percent) / 100))}</td>
          <td className="p-2"><button type="button" disabled={form.lines.length === 1} onClick={() => setForm({ ...form, lines: form.lines.filter((_, i) => i !== index) })} className="text-rose-600 disabled:opacity-30"><X className="size-4" /></button></td>
        </tr>)}</tbody></table><button type="button" onClick={() => setForm({ ...form, lines: [...form.lines, emptyLine()] })} className="m-3 flex items-center gap-1 text-xs font-semibold text-primary"><Plus className="size-3" /> Add line</button></div>
        <div className="grid gap-4 lg:grid-cols-[1fr_300px]"><label className="text-xs font-semibold">Notes<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={4} className="mt-1.5 w-full rounded-xl border p-3 text-sm" /></label><div className="rounded-xl border bg-muted/20 p-4 text-sm"><Total label="Subtotal" value={totals.subtotal} /><Total label="Tax" value={totals.tax} /><div className="my-2 border-t" /><Total label="Grand total" value={totals.total} strong /></div></div>
      </fieldset><DialogFooter><button type="button" onClick={() => setOpen(false)} className="h-10 rounded-xl border px-5">{viewOnly ? 'Close' : 'Cancel'}</button>{!viewOnly && <button disabled={saving} className="h-10 rounded-xl bg-primary px-5 font-semibold text-white">{saving ? 'Saving...' : `Save draft ${kind}`}</button>}</DialogFooter></form>
    </DialogContent></Dialog>
  </main>;
}

function Select({ label, value, set, rows, labelKey = 'name', optional }: { label: string; value: string; set: (value: string) => void; rows: Row[]; labelKey?: string; optional?: boolean }) {
  return <label className="text-xs font-semibold">{label}{!optional && <span className="text-rose-500"> *</span>}<select required={!optional} value={value} onChange={(event) => set(event.target.value)} className="mt-1.5 h-10 w-full rounded-xl border bg-background px-3 text-sm"><option value="">Select {label.toLowerCase()}</option>{rows.map((row) => <option key={row.id} value={row.id}>{String(row[labelKey] || row.name || '')}</option>)}</select></label>;
}
function Field({ label, value, set, type = 'text', optional, disabled }: { label: string; value: string; set: (value: string) => void; type?: string; optional?: boolean; disabled?: boolean }) {
  return <label className="text-xs font-semibold">{label}{!optional && <span className="text-rose-500"> *</span>}<input disabled={disabled} required={!optional} type={type} step={type === 'number' ? '.000001' : undefined} min={type === 'number' ? '.000001' : undefined} value={value} onChange={(event) => set(event.target.value)} className="mt-1.5 h-10 w-full rounded-xl border bg-background px-3 text-sm disabled:bg-muted" /></label>;
}
function Summary({ label, value }: { label: string; value: string }) { return <div><p className="text-[10px] font-semibold uppercase text-muted-foreground">{label}</p><p className="mt-1 text-sm font-bold capitalize">{value}</p></div>; }
function Total({ label, value, strong }: { label: string; value: number; strong?: boolean }) { return <div className={`flex justify-between py-1 ${strong ? 'text-base font-bold' : ''}`}><span>{label}</span><span>{money(value)}</span></div>; }
function Status({ bill }: { bill: VendorBill }) {
  const key = bill.state === 'cancelled' ? 'cancelled' : bill.payment_state === 'paid' ? 'paid' : bill.payment_state === 'partial' ? 'partial' : bill.state;
  const styles: Record<string, string> = { draft: 'bg-zinc-100 text-zinc-700', posted: 'bg-blue-50 text-blue-700', partial: 'bg-orange-50 text-orange-700', paid: 'bg-emerald-50 text-emerald-700', cancelled: 'bg-rose-50 text-rose-700' };
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${styles[key] || styles.draft}`}>{key.replace('_', ' ').toUpperCase()}</span>;
}
