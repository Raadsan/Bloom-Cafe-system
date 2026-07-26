'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Edit3, Eye, Plus, RefreshCw, Send, Trash2 } from 'lucide-react';
import { vendorPaymentApi, type VendorPayment } from '@/lib/api/accounting/payables/vendorPaymentApi';
import { vendorBillApi, type VendorBill } from '@/lib/api/accounting/payables/vendorBillApi';
import { vendorApi } from '@/lib/api/accounting/payables/vendorApi';
import { accountingPaymentMethodApi } from '@/lib/api/accounting/configuration/paymentMethodApi';
import { bankAccountApi } from '@/lib/api/accounting/banking/bankAccountApi';
import { companyApi } from '@/lib/api/accounting/configuration/companyApi';
import { useToast } from '@/components/ui/toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DashboardDataTable, { type DashboardTableColumn } from '@/components/shared/DashboardDataTable';
import { actionBtnDelete, actionBtnEdit, actionBtnView, btnCreatePage, dashboardSelectClass, dashboardStatusBadgeClass, pageHeaderTitleClass, pageHeaderWrapperClass } from '@/lib/dashboard-ui';

type Row = { id: number; [key: string]: unknown };
type Allocation = { bill_id: number; allocated_amount: number };
type Form = { vendor_id: string; bank_account_id: string; payment_method_id: string; payment_date: string; currency_id: string; exchange_rate: string; amount: string; reference: string; memo: string; allocations: Allocation[] };
const today = () => new Date().toISOString().slice(0, 10);
const empty = (): Form => ({ vendor_id: '', bank_account_id: '', payment_method_id: '', payment_date: today(), currency_id: '', exchange_rate: '1', amount: '', reference: '', memo: '', allocations: [] });
const day = (value: unknown) => value ? new Date(String(value)).toISOString().slice(0, 10) : '';
const money = (value: unknown, code = '') => `${code ? `${code} ` : ''}${Number(value || 0).toFixed(2)}`;
const message = (error: unknown) => axios.isAxiosError(error) ? error.response?.data?.message || error.message : error instanceof Error ? error.message : 'Something went wrong';

export default function VendorPaymentsPage() {
  const { showToast } = useToast();
  const [payments, setPayments] = useState<VendorPayment[]>([]);
  const [vendors, setVendors] = useState<Row[]>([]);
  const [bills, setBills] = useState<VendorBill[]>([]);
  const [methods, setMethods] = useState<Row[]>([]);
  const [banks, setBanks] = useState<Row[]>([]);
  const [companies, setCompanies] = useState<Row[]>([]);
  const [form, setForm] = useState<Form>(empty);
  const [selected, setSelected] = useState<VendorPayment | null>(null);
  const [open, setOpen] = useState(false);
  const [readonly, setReadonly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [vendorFilter, setVendorFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [paymentRows, vendorRows, billRows, methodRows, bankRows, companyRows] = await Promise.all([vendorPaymentApi.getAll(), vendorApi.getAll(), vendorBillApi.getAll(), accountingPaymentMethodApi.getAll(), bankAccountApi.getAll(), companyApi.getAll()]);
      setPayments(paymentRows); setVendors(vendorRows); setBills(billRows); setMethods(methodRows); setBanks(bankRows); setCompanies(companyRows);
    } catch (error) { showToast(message(error), 'error'); } finally { setLoading(false); }
  }, [showToast]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  const vendor = vendors.find((row) => row.id === Number(form.vendor_id));
  const company = companies.find((row) => row.id === Number(vendor?.company_id));
  const availableBanks = banks.filter((row) => Number(row.company_id) === Number(vendor?.company_id) && row.is_active !== false && row.journal_id);
  const openBills = bills.filter((bill) => bill.vendor_id === Number(form.vendor_id) && bill.state === 'posted' && Number(bill.currency_id) === Number(form.currency_id) && (Number(bill.amount_due) > 0 || form.allocations.some((row) => row.bill_id === bill.id)));
  const allocated = form.allocations.reduce((sum, row) => sum + Number(row.allocated_amount || 0), 0);
  const unallocated = Number(form.amount || 0) - allocated;
  const filtered = payments.filter((payment) => {
    const needle = query.trim().toLowerCase();
    return (!needle || [payment.payment_number, payment.vendors?.name, payment.reference].some((value) => String(value || '').toLowerCase().includes(needle))) &&
      (status === 'all' || payment.state === status) && (vendorFilter === 'all' || payment.vendor_id === Number(vendorFilter));
  });

  function createPayment() { setSelected(null); setReadonly(false); setForm(empty()); setOpen(true); }
  function selectVendor(value: string) {
    const next = vendors.find((row) => row.id === Number(value));
    const nextCompany = companies.find((row) => row.id === Number(next?.company_id));
    setForm((current) => ({ ...current, vendor_id: value, bank_account_id: '', currency_id: String(next?.currency_id || nextCompany?.currency_id || ''), exchange_rate: '1', allocations: [] }));
  }
  function selectBank(value: string) {
    const bank = banks.find((row) => row.id === Number(value));
    setForm((current) => ({ ...current, bank_account_id: value, currency_id: String(bank?.currency_id || current.currency_id), allocations: [] }));
  }
  function edit(payment: VendorPayment, view = false) {
    setSelected(payment); setReadonly(view || payment.state !== 'draft');
    setForm({ vendor_id: String(payment.vendor_id), bank_account_id: String(payment.bank_account_id || ''), payment_method_id: String(payment.payment_method_id), payment_date: day(payment.payment_date), currency_id: String(payment.currency_id), exchange_rate: String(payment.exchange_rate || 1), amount: String(payment.amount), reference: String(payment.reference || ''), memo: String(payment.memo || ''), allocations: (payment.payment_allocations || []).map((row) => ({ bill_id: row.bill_id, allocated_amount: Number(row.allocated_amount) })) });
    setOpen(true);
  }
  function toggleBill(bill: VendorBill) {
    const exists = form.allocations.some((row) => row.bill_id === bill.id);
    setForm((current) => ({ ...current, allocations: exists ? current.allocations.filter((row) => row.bill_id !== bill.id) : [...current.allocations, { bill_id: bill.id, allocated_amount: Math.min(Number(bill.amount_due), Math.max(0, Number(current.amount) - current.allocations.reduce((sum, row) => sum + row.allocated_amount, 0))) }] }));
  }
  function setAllocation(billId: number, value: string) { setForm((current) => ({ ...current, allocations: current.allocations.map((row) => row.bill_id === billId ? { ...row, allocated_amount: Number(value) } : row) })); }
  function autoAllocate() {
    let remaining = Number(form.amount || 0);
    const rows: Allocation[] = [];
    [...openBills].sort((a, b) => day(a.due_date).localeCompare(day(b.due_date))).forEach((bill) => { if (remaining > 0) { const amount = Math.min(remaining, Number(bill.amount_due)); if (amount > 0) rows.push({ bill_id: bill.id, allocated_amount: Math.round(amount * 100) / 100 }); remaining -= amount; } });
    setForm((current) => ({ ...current, allocations: rows }));
  }
  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true);
    const payload = { ...form, vendor_id: Number(form.vendor_id), bank_account_id: Number(form.bank_account_id), payment_method_id: Number(form.payment_method_id), payment_date: new Date(`${form.payment_date}T00:00:00.000Z`).toISOString(), currency_id: Number(form.currency_id), exchange_rate: Number(form.exchange_rate), amount: Number(form.amount) };
    try {
      if (selected) await vendorPaymentApi.update(selected.id, payload); else await vendorPaymentApi.create(payload);
      showToast(`Draft vendor payment ${selected ? 'updated' : 'created'} successfully`, 'success'); setOpen(false); await load();
    } catch (error) { showToast(message(error), 'error'); } finally { setSaving(false); }
  }
  async function post(payment: VendorPayment) {
    if (!window.confirm(`Post ${payment.payment_number}? Bill balances will be updated.`)) return;
    try { await vendorPaymentApi.post(payment.id); showToast('Vendor payment posted successfully', 'success'); await load(); } catch (error) { showToast(message(error), 'error'); }
  }
  async function remove(payment: VendorPayment) {
    if (!window.confirm(`Delete draft ${payment.payment_number}?`)) return;
    try { await vendorPaymentApi.remove(payment.id); showToast('Draft vendor payment deleted', 'success'); await load(); } catch (error) { showToast(message(error), 'error'); }
  }
  const columns: DashboardTableColumn<VendorPayment>[] = [
    { key: 'number', header: 'Payment', cell: (row) => <span className="font-bold text-primary">{row.payment_number}</span> },
    { key: 'date', header: 'Date', cell: (row) => day(row.payment_date) },
    { key: 'vendor', header: 'Vendor', cell: (row) => row.vendors?.name || '—' },
    { key: 'method', header: 'Method', cell: (row) => row.payment_methods?.name || '—' },
    { key: 'account', header: 'Bank Account', cell: (row) => row.bank_accounts?.account_name || '—' },
    { key: 'amount', header: 'Amount', align: 'right', cell: (row) => <span className="font-semibold">{money(row.amount, row.currencies?.code)}</span> },
    { key: 'allocated', header: 'Allocated', align: 'right', cell: (row) => money(Number(row.amount) - Number(row.unallocated_amount)) },
    { key: 'state', header: 'Status', align: 'center', cell: (row) => <span className={`${dashboardStatusBadgeClass} ${row.state === 'posted' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}`}>{row.state}</span> },
    { key: 'actions', header: 'Actions', align: 'right', cell: (row) => <div className="flex justify-end gap-1"><button title="View" onClick={() => edit(row, true)} className={actionBtnView}><Eye className="size-4" /></button>{row.state === 'draft' && <><button title="Edit" onClick={() => edit(row)} className={actionBtnEdit}><Edit3 className="size-4" /></button><button title="Post" onClick={() => void post(row)} className={actionBtnView}><Send className="size-4" /></button><button title="Delete" onClick={() => void remove(row)} className={actionBtnDelete}><Trash2 className="size-4" /></button></>}</div> },
  ];

  return <main className="dashboard-scope space-y-5 p-4 sm:p-6 lg:p-8">
    <div className={pageHeaderWrapperClass}><p className="text-xs font-bold uppercase tracking-[.2em] text-primary">Payables</p><h1 className={pageHeaderTitleClass}>Vendor Payments</h1><p className="mt-1 text-sm text-muted-foreground">Record payments and allocate them to posted vendor bills.</p></div>
    <DashboardDataTable rows={filtered} columns={columns} loading={loading} searchValue={query} onSearchChange={setQuery} searchPlaceholder="Search payments..." emptyText="No vendor payments found" minWidth="1250px" action={<button onClick={createPayment} className={btnCreatePage}><Plus className="size-4" /> New payment</button>} filters={<><select value={vendorFilter} onChange={(event) => setVendorFilter(event.target.value)} className={dashboardSelectClass}><option value="all">All vendors</option>{vendors.map((row) => <option key={row.id} value={row.id}>{String(row.name)}</option>)}</select><select value={status} onChange={(event) => setStatus(event.target.value)} className={dashboardSelectClass}><option value="all">All statuses</option><option value="draft">Draft</option><option value="posted">Posted</option></select><button onClick={() => void load()} className="flex size-[42px] items-center justify-center rounded-md border"><RefreshCw className="size-4" /></button></>} />
    <Dialog open={open} onOpenChange={(value) => !saving && setOpen(value)}><DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl"><DialogHeader><DialogTitle>{readonly ? 'Vendor payment' : selected ? 'Edit draft payment' : 'New vendor payment'}</DialogTitle><DialogDescription>Save the payment as draft, review its bill allocation, then post it.</DialogDescription></DialogHeader><form onSubmit={save} className="space-y-5">
      <div className="grid gap-3 rounded-xl border bg-muted/30 p-4 sm:grid-cols-3"><Summary label="Payment number" value={selected?.payment_number || 'Auto (PAY####)'} /><Summary label="Status" value={selected?.state || 'draft'} /><Summary label="Company" value={String(company?.name || 'Selected from vendor')} /></div>
      <fieldset disabled={readonly || saving} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Select label="Vendor" value={form.vendor_id} set={selectVendor} rows={vendors} />
        <Field label="Payment date" type="date" value={form.payment_date} set={(value) => setForm({ ...form, payment_date: value })} />
        <Field label="Amount" type="number" value={form.amount} set={(value) => setForm({ ...form, amount: value })} />
        <Select label="Payment method" value={form.payment_method_id} set={(value) => setForm({ ...form, payment_method_id: value })} rows={methods.filter((row) => row.is_active !== false && ['outbound', 'both'].includes(String(row.payment_type)))} />
        <Select label="Bank account" value={form.bank_account_id} set={selectBank} rows={availableBanks} labelKey="account_name" />
        <Field label="Currency ID" value={form.currency_id} set={() => {}} disabled />
        <Field label="Exchange rate" type="number" value={form.exchange_rate} set={(value) => setForm({ ...form, exchange_rate: value })} />
        <Field label="Reference" value={form.reference} set={(value) => setForm({ ...form, reference: value })} optional />
        <Field label="Memo" value={form.memo} set={(value) => setForm({ ...form, memo: value })} optional />
      </fieldset>
      <div className="rounded-2xl border"><div className="flex flex-wrap items-center justify-between gap-4 border-b p-4"><div><h3 className="font-semibold">Bill allocation</h3><p className="text-xs text-muted-foreground">Apply this payment to outstanding posted bills.</p></div><button disabled={readonly || !form.amount || !openBills.length} type="button" onClick={autoAllocate} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50">Auto Allocate</button><div className="text-right text-sm"><p>Payment: <b>{money(form.amount)}</b></p><p>Allocated: <b>{money(allocated)}</b></p><p className={unallocated < -0.005 ? 'text-rose-600' : 'text-emerald-600'}>Unallocated: <b>{money(unallocated)}</b></p></div></div>
        <div className="max-h-64 overflow-auto">{!form.vendor_id ? <p className="p-6 text-center text-sm text-muted-foreground">Select a vendor first.</p> : openBills.length === 0 ? <p className="p-6 text-center text-sm text-muted-foreground">No outstanding posted bills found.</p> : openBills.map((bill) => { const allocation = form.allocations.find((row) => row.bill_id === bill.id); return <div key={bill.id} className="grid grid-cols-[auto_1fr_repeat(3,auto)] items-center gap-4 border-t p-3 text-sm"><input disabled={readonly} type="checkbox" checked={Boolean(allocation)} onChange={() => toggleBill(bill)} /><div><b>{bill.bill_number}</b><p className="text-xs text-muted-foreground">Bill {day(bill.bill_date)} · Due {day(bill.due_date)}</p></div><div className="text-right">Total<br/><b>{money(bill.amount_total)}</b></div><div className="text-right">Outstanding<br/><b>{money(bill.amount_due)}</b></div><input aria-label={`Amount for ${bill.bill_number}`} disabled={!allocation || readonly} type="number" min=".01" max={Number(bill.amount_due)} step=".01" value={allocation?.allocated_amount ?? ''} onChange={(event) => setAllocation(bill.id, event.target.value)} className="h-10 w-32 rounded-lg border px-3 text-right" /></div>; })}</div>
      </div>
      <DialogFooter><button type="button" onClick={() => setOpen(false)} className="h-10 rounded-xl border px-5">{readonly ? 'Close' : 'Cancel'}</button>{!readonly && <button disabled={saving || unallocated < -0.005} className="h-10 rounded-xl bg-primary px-5 font-semibold text-white">{saving ? 'Saving...' : 'Save draft payment'}</button>}</DialogFooter>
    </form></DialogContent></Dialog>
  </main>;
}
function Select({ label, value, set, rows, labelKey = 'name' }: { label: string; value: string; set: (value: string) => void; rows: Row[]; labelKey?: string }) { return <label className="text-xs font-semibold">{label} *<select required value={value} onChange={(event) => set(event.target.value)} className="mt-1.5 h-10 w-full rounded-xl border bg-background px-3"><option value="">Select {label.toLowerCase()}</option>{rows.map((row) => <option key={row.id} value={row.id}>{String(row[labelKey] || row.name || '')}</option>)}</select></label>; }
function Field({ label, value, set, type = 'text', optional, disabled }: { label: string; value: string; set: (value: string) => void; type?: string; optional?: boolean; disabled?: boolean }) { return <label className="text-xs font-semibold">{label}{!optional && ' *'}<input disabled={disabled} required={!optional} type={type} min={type === 'number' ? '.000001' : undefined} step={type === 'number' ? '.000001' : undefined} value={value} onChange={(event) => set(event.target.value)} className="mt-1.5 h-10 w-full rounded-xl border bg-background px-3 disabled:bg-muted" /></label>; }
function Summary({ label, value }: { label: string; value: string }) { return <div><p className="text-[10px] font-semibold uppercase text-muted-foreground">{label}</p><p className="mt-1 text-sm font-bold capitalize">{value}</p></div>; }
