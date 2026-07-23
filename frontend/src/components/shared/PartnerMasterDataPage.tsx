'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Edit3, Plus, RefreshCw, Search, Trash2, Users } from 'lucide-react';
import { createAccountingCrudApi, type AccountingRecord } from '@/lib/api/accounting/accountingCrud';
import { useToast } from '@/components/ui/toast';
import { usePermissions } from '@/context/PermissionContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type Kind = 'customer' | 'vendor';
type Record = AccountingRecord & { name?: string; fullName?: string; phone?: string; email?: string; address?: string; is_active?: boolean };
const EMPTY = { name: '', phone: '', email: '', address: '', is_active: true };

function message(error: unknown) {
  if (axios.isAxiosError(error)) return error.response?.data?.message || error.message;
  return error instanceof Error ? error.message : 'Something went wrong';
}

export default function PartnerMasterDataPage({ kind, restaurantLabel = false }: { kind: Kind; restaurantLabel?: boolean }) {
  const plural = kind === 'customer' ? 'customers' : 'vendors';
  const title = restaurantLabel ? (kind === 'customer' ? 'Customer Management' : 'Supplier Management') : (kind === 'customer' ? 'Customers' : 'Vendors');
  const singular = restaurantLabel && kind === 'vendor' ? 'supplier' : kind;
  const api = useMemo(() => createAccountingCrudApi<Record>(`/${plural}`), [plural]);
  const { showToast } = useToast();
  const permissions = usePermissions();
  const permissionUrl = restaurantLabel ? (kind === 'customer' ? '/clients' : '/suppliers') : `/${plural}`;
  const canAdd = permissions.canAdd(permissionUrl);
  const canEdit = permissions.canEdit(permissionUrl);
  const canDelete = permissions.canDelete(permissionUrl);
  const [rows, setRows] = useState<Record[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Record | null>(null);
  const [form, setForm] = useState(EMPTY);

  const revalidate = useCallback(async () => {
    setLoading(true);
    try { setRows(await api.getAll()); } catch (error) { showToast(message(error), 'error'); } finally { setLoading(false); }
  }, [api, showToast]);
  useEffect(() => {
    const timer = window.setTimeout(() => void revalidate(), 0);
    return () => window.clearTimeout(timer);
  }, [revalidate]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => !needle || [row.name, row.fullName, row.phone, row.email].some((value) => String(value || '').toLowerCase().includes(needle)));
  }, [query, rows]);

  function beginCreate() { setSelected(null); setForm(EMPTY); setOpen(true); }
  function beginEdit(row: Record) {
    setSelected(row);
    setForm({ name: String(row.name || row.fullName || ''), phone: String(row.phone || ''), email: String(row.email || ''), address: String(row.address || ''), is_active: row.is_active !== false });
    setOpen(true);
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true);
    try {
      if (selected) await api.update(selected.id, form); else await api.create(form);
      showToast(`${singular[0].toUpperCase()}${singular.slice(1)} ${selected ? 'updated' : 'created'} successfully`, 'success');
      setOpen(false);
      await revalidate();
    } catch (error) { showToast(message(error), 'error'); } finally { setSaving(false); }
  }
  async function remove(row: Record) {
    if (!window.confirm(`Delete ${row.name || row.fullName || singular}?`)) return;
    try { await api.remove(row.id); showToast(`${singular[0].toUpperCase()}${singular.slice(1)} deleted successfully`, 'success'); await revalidate(); }
    catch (error) { showToast(message(error), 'error'); }
  }

  return <main className="dashboard-scope space-y-5 p-4 sm:p-6 lg:p-8">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div><h1 className="text-3xl font-bold">{title}</h1></div>
      {canAdd && <button onClick={beginCreate} className="flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white"><Plus className="size-4" /> Add {singular}</button>}
    </div>
    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="flex items-center gap-3 border-b p-4"><div className="relative max-w-sm flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${plural}...`} className="h-10 w-full rounded-xl border bg-background pl-9 pr-3 text-sm" /></div><button onClick={() => void revalidate()} aria-label="Refresh" className="rounded-lg border p-2"><RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} /></button></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-muted/50 text-xs uppercase text-muted-foreground"><tr><th className="px-5 py-3">ID</th><th className="px-4 py-3">Name</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th></tr></thead>
      <tbody className="divide-y">{!loading && filtered.map((row) => <tr key={row.id}><td className="px-5 py-3 font-semibold text-primary">#{row.id}</td><td className="px-4 py-3 font-medium">{row.name || row.fullName}</td><td className="px-4 py-3">{row.phone || '—'}</td><td className="px-4 py-3">{row.email || '—'}</td><td className="px-4 py-3">{row.is_active === false ? 'Inactive' : 'Active'}</td><td className="px-5 py-3"><div className="flex justify-end gap-1">{canEdit && <button onClick={() => beginEdit(row)} aria-label="Edit" className="rounded-lg p-2 hover:bg-muted"><Edit3 className="size-4" /></button>}{canDelete && <button onClick={() => void remove(row)} aria-label="Delete" className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"><Trash2 className="size-4" /></button>}</div></td></tr>)}</tbody></table>
      {!loading && filtered.length === 0 && <div className="flex flex-col items-center py-14 text-muted-foreground"><Users className="size-8" /><p className="mt-2 text-sm">No {plural} found.</p></div>}</div>
    </section>
    <Dialog open={open} onOpenChange={(value) => !saving && setOpen(value)}><DialogContent><DialogHeader><DialogTitle>{selected ? 'Edit' : 'Add'} {singular}</DialogTitle><DialogDescription>This record is immediately available in both workspaces.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-4">
      <label className="block text-sm font-medium">Name *<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 h-10 w-full rounded-lg border px-3" /></label>
      <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Phone<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1 h-10 w-full rounded-lg border px-3" /></label><label className="text-sm font-medium">Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 h-10 w-full rounded-lg border px-3" /></label></div>
      <label className="block text-sm font-medium">Address<input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-1 h-10 w-full rounded-lg border px-3" /></label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active</label>
      <DialogFooter><button type="button" onClick={() => setOpen(false)} className="h-10 rounded-lg border px-4">Cancel</button><button disabled={saving} className="h-10 rounded-lg bg-primary px-5 font-semibold text-white">{saving ? 'Saving...' : 'Save'}</button></DialogFooter>
    </form></DialogContent></Dialog>
  </main>;
}
