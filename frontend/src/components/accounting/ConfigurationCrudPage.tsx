'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Check, Edit3, Plus, RefreshCw, Search, Settings2, Trash2 } from 'lucide-react';
import { createAccountingCrudApi, type AccountingRecord } from '@/lib/api/accounting/accountingCrud';
import { currencyApi } from '@/lib/api/accounting/configuration/currencyApi';
import { accountingProductCategoryApi } from '@/lib/api/accounting/configuration/productCategoryApi';
import { useToast } from '@/components/ui/toast';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

type Value = string | number | boolean | null;
type Row = AccountingRecord & Record<string, unknown>;
type Field = {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'email' | 'select' | 'boolean' | 'textarea';
  required?: boolean;
  options?: Array<{ label: string; value: string | number }>;
  relation?: 'currencies' | 'categories';
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
};
type Config = {
  title: string;
  description: string;
  resource: string;
  singular: string;
  fields: Field[];
  columns: string[];
  defaults: Record<string, Value>;
};

const CONFIGS: Record<string, Config> = {
  'account-types': {
    title: 'Account Types', singular: 'account type', resource: '/accounting/configuration/account-types',
    description: 'Define the classifications used to organize your chart of accounts.',
    columns: ['name', 'internal_group', 'normal_balance', 'report_type', 'sequence'],
    defaults: { name: '', internal_group: 'asset', normal_balance: 'debit', report_type: 'balance_sheet', sequence: 10 },
    fields: [
      { key: 'name', label: 'Name', required: true, placeholder: 'e.g. Current Assets' },
      { key: 'internal_group', label: 'Internal Group', type: 'select', required: true, options: options(['asset', 'liability', 'equity', 'income', 'expense']) },
      { key: 'normal_balance', label: 'Normal Balance', type: 'select', required: true, options: options(['debit', 'credit']) },
      { key: 'report_type', label: 'Report Type', type: 'select', required: true, options: options(['balance_sheet', 'profit_loss']) },
      { key: 'sequence', label: 'Sequence', type: 'number', required: true, min: 0, step: 1 },
    ],
  },
  currencies: {
    title: 'Currencies', singular: 'currency', resource: '/accounting/configuration/currencies',
    description: 'Manage the currencies available for companies and financial transactions.',
    columns: ['code', 'name', 'symbol', 'decimal_places', 'is_active'],
    defaults: { code: '', name: '', symbol: '', decimal_places: 2, is_active: true },
    fields: [
      { key: 'code', label: 'Currency Code', required: true, placeholder: 'e.g. USD' },
      { key: 'name', label: 'Currency Name', required: true, placeholder: 'e.g. US Dollar' },
      { key: 'symbol', label: 'Symbol', placeholder: 'e.g. $' },
      { key: 'decimal_places', label: 'Decimal Places', type: 'number', required: true, min: 0, max: 6, step: 1 },
      { key: 'is_active', label: 'Active', type: 'boolean' },
    ],
  },
  companies: {
    title: 'Companies', singular: 'company', resource: '/accounting/configuration/companies',
    description: 'Maintain company identities, contact information, and base currencies.',
    columns: ['name', 'legal_name', 'currency_id', 'tax_id', 'phone', 'email', 'is_active'],
    defaults: { name: '', legal_name: '', currency_id: '', tax_id: '', address: '', city: '', country: '', phone: '', email: '', is_active: true },
    fields: [
      { key: 'name', label: 'Company Name', required: true }, { key: 'legal_name', label: 'Legal Name' },
      { key: 'currency_id', label: 'Base Currency', type: 'select', relation: 'currencies', required: true },
      { key: 'tax_id', label: 'Tax ID' }, { key: 'email', label: 'Email', type: 'email' }, { key: 'phone', label: 'Phone' },
      { key: 'address', label: 'Address' }, { key: 'city', label: 'City' }, { key: 'country', label: 'Country' },
      { key: 'is_active', label: 'Active', type: 'boolean' },
    ],
  },
  'payment-methods': {
    title: 'Payment Methods', singular: 'payment method', resource: '/accounting/configuration/payment-methods',
    description: 'Configure the ways customer receipts and vendor payments are recorded.',
    columns: ['name', 'code', 'payment_type', 'requires_reference', 'is_active'],
    defaults: { name: '', code: '', payment_type: 'both', requires_reference: false, is_active: true },
    fields: [
      { key: 'name', label: 'Name', required: true, placeholder: 'e.g. Mobile Money' },
      { key: 'code', label: 'Code', required: true, placeholder: 'e.g. MOBILE' },
      { key: 'payment_type', label: 'Payment Type', type: 'select', required: true, options: options(['inbound', 'outbound', 'both']) },
      { key: 'requires_reference', label: 'Requires Reference', type: 'boolean' },
      { key: 'is_active', label: 'Active', type: 'boolean' },
    ],
  },
  'payment-terms': {
    title: 'Payment Terms', singular: 'payment term', resource: '/accounting/configuration/payment-terms',
    description: 'Create standard payment conditions used on invoices and bills.',
    columns: ['name', 'description', 'is_active'], defaults: { name: '', description: '', is_active: true },
    fields: [
      { key: 'name', label: 'Name', required: true, placeholder: 'e.g. Net 30' },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe when payment is due' },
      { key: 'is_active', label: 'Active', type: 'boolean' },
    ],
  },
  taxes: {
    title: 'Taxes', singular: 'tax', resource: '/accounting/configuration/taxes',
    description: 'Set tax rates and how they apply to sales and purchases.',
    columns: ['name', 'tax_scope', 'rate_percent', 'price_includes_tax', 'is_active'],
    defaults: { name: '', tax_scope: 'both', rate_percent: 0, price_includes_tax: false, is_active: true },
    fields: [
      { key: 'name', label: 'Tax Name', required: true, placeholder: 'e.g. VAT 5%' },
      { key: 'tax_scope', label: 'Tax Scope', type: 'select', required: true, options: options(['sale', 'purchase', 'both']) },
      { key: 'rate_percent', label: 'Rate (%)', type: 'number', required: true, min: 0, max: 100, step: 0.01 },
      { key: 'price_includes_tax', label: 'Price Includes Tax', type: 'boolean' },
      { key: 'is_active', label: 'Active', type: 'boolean' },
    ],
  },
  'product-categories': {
    title: 'Product Categories', singular: 'product category', resource: '/accounting/configuration/product-categories',
    description: 'Organize accounting products and services into a clear category structure.',
    columns: ['name', 'parent_id'], defaults: { name: '', parent_id: null },
    fields: [
      { key: 'name', label: 'Category Name', required: true, placeholder: 'e.g. Beverages' },
      { key: 'parent_id', label: 'Parent Category', type: 'select', relation: 'categories' },
    ],
  },
};

function options(values: string[]) {
  return values.map((value) => ({ value, label: humanize(value) }));
}

function humanize(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function errorMessage(error: unknown) {
  if (axios.isAxiosError(error)) return error.response?.data?.message || error.message;
  return error instanceof Error ? error.message : 'Something went wrong';
}

function displayValue(key: string, value: unknown, relations: RelationMaps) {
  if (key === 'currency_id') return relations.currencies.get(Number(value)) || '—';
  if (key === 'parent_id') return value ? relations.categories.get(Number(value)) || `#${value}` : 'Top level';
  if (typeof value === 'boolean') return value ? 'Active' : 'Inactive';
  if (key === 'rate_percent') return `${Number(value).toFixed(2)}%`;
  if (value === null || value === undefined || value === '') return '—';
  return humanize(String(value));
}

type RelationMaps = { currencies: Map<number, string>; categories: Map<number, string> };

export default function ConfigurationCrudPage({ section }: { section: string }) {
  const config = CONFIGS[section];
  const api = useMemo(() => createAccountingCrudApi<Row>(config.resource), [config.resource]);
  const { showToast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Row | null>(null);
  const [form, setForm] = useState<Record<string, Value>>(config.defaults);
  const [relations, setRelations] = useState<RelationMaps>({ currencies: new Map(), categories: new Map() });

  const loadRows = useCallback(async () => {
    setLoading(true);
    try { setRows(await api.getAll()); }
    catch (error) { showToast(errorMessage(error), 'error'); }
    finally { setLoading(false); }
  }, [api, showToast]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadRows(), 0);
    return () => window.clearTimeout(timer);
  }, [loadRows]);
  useEffect(() => {
    const needsCurrencies = config.fields.some((field) => field.relation === 'currencies');
    const needsCategories = config.fields.some((field) => field.relation === 'categories');
    Promise.all([
      needsCurrencies ? currencyApi.getAll() : Promise.resolve([]),
      needsCategories ? accountingProductCategoryApi.getAll() : Promise.resolve([]),
    ]).then(([currencies, categories]) => setRelations({
      currencies: new Map(currencies.map((item) => [item.id, `${String(item.code || '')} — ${String(item.name || '')}`])),
      categories: new Map(categories.map((item) => [item.id, String(item.name || '')])),
    })).catch(() => undefined);
  }, [config.fields]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) => config.columns.some((key) => String(displayValue(key, row[key], relations)).toLowerCase().includes(needle)));
  }, [config.columns, query, relations, rows]);

  function openCreate() {
    setSelected(null); setForm({ ...config.defaults }); setFormOpen(true);
  }

  function openEdit(row: Row) {
    setSelected(row);
    setForm(Object.fromEntries(config.fields.map((field) => [field.key, (row[field.key] as Value) ?? config.defaults[field.key] ?? ''])));
    setFormOpen(true);
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true);
    const payload = Object.fromEntries(config.fields.map((field) => {
      let value = form[field.key];
      if (field.type === 'number') value = Number(value);
      if ((field.key.endsWith('_id') || field.type === 'number') && value === '') value = null;
      return [field.key, value];
    }));
    try {
      if (selected) await api.update(selected.id, payload); else await api.create(payload);
      showToast(`${humanize(config.singular)} ${selected ? 'updated' : 'created'} successfully`);
      setFormOpen(false); await loadRows();
    } catch (error) { showToast(errorMessage(error), 'error'); }
    finally { setSaving(false); }
  }

  async function confirmDelete() {
    if (!selected) return; setSaving(true);
    try {
      await api.remove(selected.id); showToast(`${humanize(config.singular)} deleted successfully`);
      setDeleteOpen(false); setSelected(null); await loadRows();
    } catch (error) { showToast(errorMessage(error), 'error'); }
    finally { setSaving(false); }
  }

  return (
    <main className="dashboard-scope space-y-5 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-primary"><Settings2 className="size-4" /><span className="text-xs font-semibold uppercase tracking-[0.16em]">Configuration</span></div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{config.title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{config.description}</p>
        </div>
        <button onClick={openCreate} className="flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90">
          <Plus className="size-4" /> Add {humanize(config.singular)}
        </button>
      </div>

      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b p-4 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${config.title.toLowerCase()}...`} className="h-10 w-full rounded-xl border bg-background pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{filtered.length} {filtered.length === 1 ? 'record' : 'records'}</span>
            <button onClick={() => void loadRows()} disabled={loading} aria-label="Refresh records" className="rounded-lg border p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"><RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} /></button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="bg-muted/50 text-[10px] uppercase tracking-wider text-muted-foreground"><tr><th className="w-16 px-5 py-3 font-semibold">ID</th>{config.columns.map((column) => <th key={column} className="px-4 py-3 font-semibold">{humanize(column.replace('_id', ''))}</th>)}<th className="px-5 py-3 text-right font-semibold">Actions</th></tr></thead>
            <tbody className="divide-y">
              {loading ? Array.from({ length: 4 }, (_, index) => <tr key={index}>{Array.from({ length: config.columns.length + 2 }, (__, cell) => <td key={cell} className="px-4 py-4"><div className="h-4 animate-pulse rounded bg-muted" /></td>)}</tr>) :
                filtered.map((row) => <tr key={row.id} className="transition hover:bg-muted/30"><td className="px-5 py-3.5 font-semibold text-primary">#{row.id}</td>{config.columns.map((column) => <td key={column} className="max-w-[240px] truncate px-4 py-3.5">{column === 'is_active' ? <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${row[column] ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'}`}>{row[column] ? <Check className="size-3" /> : null}{displayValue(column, row[column], relations)}</span> : displayValue(column, row[column], relations)}</td>)}<td className="px-5 py-3.5"><div className="flex justify-end gap-1"><button onClick={() => openEdit(row)} aria-label={`Edit ${config.singular}`} className="rounded-lg p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary"><Edit3 className="size-4" /></button><button onClick={() => { setSelected(row); setDeleteOpen(true); }} aria-label={`Delete ${config.singular}`} className="rounded-lg p-2 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"><Trash2 className="size-4" /></button></div></td></tr>)}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && <div className="flex flex-col items-center px-6 py-16 text-center"><div className="flex size-12 items-center justify-center rounded-2xl bg-primary/8 text-primary"><Settings2 className="size-5" /></div><h3 className="mt-4 text-sm font-semibold">No {config.title.toLowerCase()} found</h3><p className="mt-1 text-xs text-muted-foreground">{query ? 'Try a different search term.' : `Add your first ${config.singular} to get started.`}</p></div>}
        </div>
      </section>

      <Dialog open={formOpen} onOpenChange={(open) => !saving && setFormOpen(open)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>{selected ? 'Edit' : 'Add'} {humanize(config.singular)}</DialogTitle><DialogDescription>{selected ? 'Update the fields below and save your changes.' : `Create a new ${config.singular} for your accounting workspace.`}</DialogDescription></DialogHeader>
          <form onSubmit={submit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              {config.fields.map((field) => <FormField key={field.key} field={field} value={form[field.key]} onChange={(value) => setForm((current) => ({ ...current, [field.key]: value }))} relations={relations} currentId={selected?.id} />)}
            </div>
            <DialogFooter><button type="button" onClick={() => setFormOpen(false)} disabled={saving} className="h-10 rounded-xl border px-5 text-xs font-semibold hover:bg-muted disabled:opacity-50">Cancel</button><button type="submit" disabled={saving} className="h-10 rounded-xl bg-primary px-5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">{saving ? 'Saving...' : selected ? 'Save Changes' : `Add ${humanize(config.singular)}`}</button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={(open) => !saving && setDeleteOpen(open)}>
        <DialogContent className="sm:max-w-md"><DialogHeader><div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/10"><Trash2 className="size-5" /></div><DialogTitle>Delete {humanize(config.singular)}?</DialogTitle><DialogDescription>This permanently deletes this record. It cannot be undone, and linked accounting records may prevent deletion.</DialogDescription></DialogHeader><DialogFooter><button onClick={() => setDeleteOpen(false)} disabled={saving} className="h-10 rounded-xl border px-5 text-xs font-semibold hover:bg-muted">Cancel</button><button onClick={() => void confirmDelete()} disabled={saving} className="h-10 rounded-xl bg-rose-600 px-5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50">{saving ? 'Deleting...' : 'Delete Record'}</button></DialogFooter></DialogContent>
      </Dialog>
    </main>
  );
}

function FormField({ field, value, onChange, relations, currentId }: { field: Field; value: Value | undefined; onChange: (value: Value) => void; relations: RelationMaps; currentId?: number }) {
  if (field.type === 'boolean') return <label className="flex min-h-11 items-center justify-between gap-3 rounded-xl border p-3 sm:col-span-2"><div><span className="text-xs font-semibold">{field.label}</span><p className="mt-0.5 text-[10px] text-muted-foreground">Enable this option for the record</p></div><button type="button" role="switch" aria-checked={Boolean(value)} onClick={() => onChange(!value)} className={`relative h-6 w-11 rounded-full transition ${value ? 'bg-primary' : 'bg-muted-foreground/30'}`}><span className={`absolute top-1 size-4 rounded-full bg-white shadow transition ${value ? 'left-6' : 'left-1'}`} /></button></label>;
  const relationOptions = field.relation === 'currencies' ? [...relations.currencies.entries()].map(([optionValue, label]) => ({ value: optionValue, label })) : field.relation === 'categories' ? [...relations.categories.entries()].filter(([id]) => id !== currentId).map(([optionValue, label]) => ({ value: optionValue, label })) : field.options;
  const base = 'mt-1.5 min-h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10';
  return <label className={field.type === 'textarea' ? 'sm:col-span-2' : ''}><span className="text-xs font-semibold">{field.label}{field.required && <span className="ml-0.5 text-rose-500">*</span>}</span>{field.type === 'select' ? <select required={field.required} value={value === null ? '' : String(value ?? '')} onChange={(event) => onChange(event.target.value === '' ? null : field.relation ? Number(event.target.value) : event.target.value)} className={base}><option value="">Select {field.label.toLowerCase()}</option>{relationOptions?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : field.type === 'textarea' ? <textarea required={field.required} value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} placeholder={field.placeholder} rows={3} className={`${base} resize-none py-2.5`} /> : <input required={field.required} type={field.type || 'text'} value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} placeholder={field.placeholder} min={field.min} max={field.max} step={field.step} className={base} />}</label>;
}
