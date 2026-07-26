'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Edit3, Landmark, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { bankApi } from '@/lib/api/accounting/banking/bankApi';
import { bankAccountApi } from '@/lib/api/accounting/banking/bankAccountApi';
import { companyApi } from '@/lib/api/accounting/configuration/companyApi';
import { currencyApi } from '@/lib/api/accounting/configuration/currencyApi';
import { chartOfAccountApi } from '@/lib/api/accounting/ledger/chartOfAccountApi';
import { accountingJournalApi } from '@/lib/api/accounting/ledger/journalApi';
import { useToast } from '@/components/ui/toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DashboardDataTable, { type DashboardTableColumn } from '@/components/shared/DashboardDataTable';
import { actionBtnDelete, actionBtnEdit, btnCreatePage, dashboardSelectClass, dashboardStatusBadgeClass, pageHeaderTitleClass, pageHeaderWrapperClass } from '@/lib/dashboard-ui';

type Row = { id: number; [key: string]: unknown };
type BankForm = { name: string; swift_bic: string; address: string; city: string; country: string; phone: string; is_active: boolean };
type AccountForm = { company_id: string; bank_id: string; account_name: string; account_number: string; iban: string; currency_id: string; gl_account_id: string; journal_id: string; is_active: boolean };
const emptyBank = (): BankForm => ({ name: '', swift_bic: '', address: '', city: '', country: '', phone: '', is_active: true });
const emptyAccount = (): AccountForm => ({ company_id: '', bank_id: '', account_name: '', account_number: '', iban: '', currency_id: '', gl_account_id: '', journal_id: '', is_active: true });
const errorMessage = (error: unknown) => axios.isAxiosError(error) ? error.response?.data?.message || error.message : error instanceof Error ? error.message : 'Something went wrong';

export default function BankingSetupPage({ kind }: { kind: 'banks' | 'accounts' }) {
  const isAccounts = kind === 'accounts';
  const api = isAccounts ? bankAccountApi : bankApi;
  const { showToast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [banks, setBanks] = useState<Row[]>([]);
  const [companies, setCompanies] = useState<Row[]>([]);
  const [currencies, setCurrencies] = useState<Row[]>([]);
  const [accounts, setAccounts] = useState<Row[]>([]);
  const [journals, setJournals] = useState<Row[]>([]);
  const [bankForm, setBankForm] = useState<BankForm>(emptyBank);
  const [accountForm, setAccountForm] = useState<AccountForm>(emptyAccount);
  const [selected, setSelected] = useState<Row | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, bankRows, companyRows, currencyRows, accountRows, journalRows] = await Promise.all([api.getAll(), bankApi.getAll(), companyApi.getAll(), currencyApi.getAll(), chartOfAccountApi.getAll(), accountingJournalApi.getAll()]);
      setRows(data); setBanks(bankRows); setCompanies(companyRows); setCurrencies(currencyRows); setAccounts(accountRows); setJournals(journalRows);
    } catch (error) { showToast(errorMessage(error), 'error'); } finally { setLoading(false); }
  }, [api, showToast]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  const filtered = useMemo(() => rows.filter((row) => {
    const needle = query.trim().toLowerCase();
    return (!needle || Object.values(row).some((value) => String(value || '').toLowerCase().includes(needle))) &&
      (status === 'all' || Boolean(row.is_active) === (status === 'active')) &&
      (!isAccounts || companyFilter === 'all' || Number(row.company_id) === Number(companyFilter));
  }), [companyFilter, isAccounts, query, rows, status]);
  const companyAccounts = accounts.filter((row) => Number(row.company_id) === Number(accountForm.company_id) && row.is_active !== false);
  const companyJournals = journals.filter((row) => Number(row.company_id) === Number(accountForm.company_id) && ['bank', 'cash'].includes(String(row.journal_type)) && row.is_active !== false);

  function create() { setSelected(null); setBankForm(emptyBank()); setAccountForm(emptyAccount()); setOpen(true); }
  function edit(row: Row) {
    setSelected(row);
    if (isAccounts) setAccountForm({ company_id: String(row.company_id || ''), bank_id: String(row.bank_id || ''), account_name: String(row.account_name || ''), account_number: String(row.account_number || ''), iban: String(row.iban || ''), currency_id: String(row.currency_id || ''), gl_account_id: String(row.gl_account_id || ''), journal_id: String(row.journal_id || ''), is_active: row.is_active !== false });
    else setBankForm({ name: String(row.name || ''), swift_bic: String(row.swift_bic || ''), address: String(row.address || ''), city: String(row.city || ''), country: String(row.country || ''), phone: String(row.phone || ''), is_active: row.is_active !== false });
    setOpen(true);
  }
  function selectCompany(value: string) {
    const company = companies.find((row) => row.id === Number(value));
    setAccountForm((current) => ({ ...current, company_id: value, currency_id: String(company?.currency_id || ''), gl_account_id: '', journal_id: '' }));
  }
  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true);
    const payload = isAccounts ? { ...accountForm, company_id: Number(accountForm.company_id), bank_id: Number(accountForm.bank_id), currency_id: Number(accountForm.currency_id), gl_account_id: accountForm.gl_account_id ? Number(accountForm.gl_account_id) : null, journal_id: accountForm.journal_id ? Number(accountForm.journal_id) : null } : bankForm;
    try {
      if (selected) await api.update(selected.id, payload); else await api.create(payload);
      showToast(`${isAccounts ? 'Bank account' : 'Bank'} ${selected ? 'updated' : 'created'} successfully`, 'success'); setOpen(false); await load();
    } catch (error) { showToast(errorMessage(error), 'error'); } finally { setSaving(false); }
  }
  async function remove(row: Row) {
    if (!window.confirm(`Delete ${String(row.account_name || row.name)}?`)) return;
    try { await api.remove(row.id); showToast(`${isAccounts ? 'Bank account' : 'Bank'} deleted`, 'success'); await load(); } catch (error) { showToast(errorMessage(error), 'error'); }
  }
  const columns: DashboardTableColumn<Row>[] = isAccounts ? [
    { key: 'name', header: 'Account Name', cell: (row) => <span className="font-semibold">{String(row.account_name)}</span> },
    { key: 'number', header: 'Account Number', cell: (row) => <span className="font-mono">{String(row.account_number)}</span> },
    { key: 'bank', header: 'Bank', cell: (row) => String(banks.find((bank) => bank.id === Number(row.bank_id))?.name || '—') },
    { key: 'company', header: 'Company', cell: (row) => String(companies.find((company) => company.id === Number(row.company_id))?.name || '—') },
    { key: 'currency', header: 'Currency', cell: (row) => String(currencies.find((currency) => currency.id === Number(row.currency_id))?.code || '—') },
    { key: 'gl', header: 'GL Account', cell: (row) => { const account = accounts.find((item) => item.id === Number(row.gl_account_id)); return account ? `${String(account.code)} — ${String(account.name)}` : '—'; } },
    { key: 'status', header: 'Status', align: 'center', cell: (row) => <Status active={row.is_active !== false} /> },
    { key: 'actions', header: 'Actions', align: 'right', cell: (row) => <Actions edit={() => edit(row)} remove={() => void remove(row)} /> },
  ] : [
    { key: 'name', header: 'Bank Name', cell: (row) => <span className="font-semibold">{String(row.name)}</span> },
    { key: 'swift', header: 'SWIFT / BIC', cell: (row) => String(row.swift_bic || '—') },
    { key: 'location', header: 'Location', cell: (row) => [row.city, row.country].filter(Boolean).join(', ') || '—' },
    { key: 'phone', header: 'Phone', cell: (row) => String(row.phone || '—') },
    { key: 'status', header: 'Status', align: 'center', cell: (row) => <Status active={row.is_active !== false} /> },
    { key: 'actions', header: 'Actions', align: 'right', cell: (row) => <Actions edit={() => edit(row)} remove={() => void remove(row)} /> },
  ];

  return <main className="dashboard-scope space-y-5 p-4 sm:p-6 lg:p-8">
    <div className={pageHeaderWrapperClass}><div className="flex items-center gap-2 text-primary"><Landmark className="size-4" /><span className="text-xs font-bold uppercase tracking-[.2em]">Banking</span></div><h1 className={pageHeaderTitleClass}>{isAccounts ? 'Bank Accounts' : 'Banks'}</h1><p className="mt-1 text-sm text-muted-foreground">{isAccounts ? 'Connect bank accounts to company currencies, journals, and ledger accounts.' : 'Maintain the financial institutions used by your companies.'}</p></div>
    <DashboardDataTable rows={filtered} columns={columns} loading={loading} searchValue={query} onSearchChange={setQuery} searchPlaceholder={`Search ${isAccounts ? 'bank accounts' : 'banks'}...`} emptyText={`No ${isAccounts ? 'bank accounts' : 'banks'} found`} minWidth="1000px" action={<button onClick={create} className={btnCreatePage}><Plus className="size-4" /> Add {isAccounts ? 'account' : 'bank'}</button>} filters={<>{isAccounts && <select value={companyFilter} onChange={(event) => setCompanyFilter(event.target.value)} className={dashboardSelectClass}><option value="all">All companies</option>{companies.map((row) => <option key={row.id} value={row.id}>{String(row.name)}</option>)}</select>}<select value={status} onChange={(event) => setStatus(event.target.value)} className={dashboardSelectClass}><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select><button onClick={() => void load()} className="flex size-[42px] items-center justify-center rounded-md border"><RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} /></button></>} />
    <Dialog open={open} onOpenChange={(value) => !saving && setOpen(value)}><DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{selected ? 'Edit' : 'Add'} {isAccounts ? 'bank account' : 'bank'}</DialogTitle><DialogDescription>{isAccounts ? 'Configure the account and its accounting connections.' : 'Enter the institution’s identification and contact details.'}</DialogDescription></DialogHeader><form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
      {isAccounts ? <>
        <Select label="Company" value={accountForm.company_id} set={selectCompany} rows={companies} />
        <Select label="Bank" value={accountForm.bank_id} set={(value) => setAccountForm({ ...accountForm, bank_id: value })} rows={banks.filter((row) => row.is_active !== false)} />
        <Field label="Account name" value={accountForm.account_name} set={(value) => setAccountForm({ ...accountForm, account_name: value })} />
        <Field label="Account number" value={accountForm.account_number} set={(value) => setAccountForm({ ...accountForm, account_number: value })} />
        <Field label="IBAN" value={accountForm.iban} set={(value) => setAccountForm({ ...accountForm, iban: value })} optional />
        <Select label="Currency" value={accountForm.currency_id} set={(value) => setAccountForm({ ...accountForm, currency_id: value })} rows={currencies.filter((row) => row.is_active !== false)} labelKey="code" />
        <Select label="GL account" value={accountForm.gl_account_id} set={(value) => setAccountForm({ ...accountForm, gl_account_id: value })} rows={companyAccounts} account />
        <Select label="Bank/Cash journal" value={accountForm.journal_id} set={(value) => setAccountForm({ ...accountForm, journal_id: value })} rows={companyJournals} account />
        <Toggle label="Active account" checked={accountForm.is_active} set={(value) => setAccountForm({ ...accountForm, is_active: value })} />
      </> : <>
        <Field label="Bank name" value={bankForm.name} set={(value) => setBankForm({ ...bankForm, name: value })} />
        <Field label="SWIFT / BIC" value={bankForm.swift_bic} set={(value) => setBankForm({ ...bankForm, swift_bic: value.toUpperCase() })} optional />
        <Field label="Address" value={bankForm.address} set={(value) => setBankForm({ ...bankForm, address: value })} optional />
        <Field label="City" value={bankForm.city} set={(value) => setBankForm({ ...bankForm, city: value })} optional />
        <Field label="Country" value={bankForm.country} set={(value) => setBankForm({ ...bankForm, country: value })} optional />
        <Field label="Phone" value={bankForm.phone} set={(value) => setBankForm({ ...bankForm, phone: value })} optional />
        <Toggle label="Active bank" checked={bankForm.is_active} set={(value) => setBankForm({ ...bankForm, is_active: value })} />
      </>}
      <DialogFooter className="sm:col-span-2"><button type="button" onClick={() => setOpen(false)} className="h-10 rounded-xl border px-5">Cancel</button><button disabled={saving} className="h-10 rounded-xl bg-primary px-5 font-semibold text-white">{saving ? 'Saving...' : 'Save'}</button></DialogFooter>
    </form></DialogContent></Dialog>
  </main>;
}
function Status({ active }: { active: boolean }) { return <span className={`${dashboardStatusBadgeClass} ${active ? 'bg-emerald-600 text-white' : 'bg-zinc-500 text-white'}`}>{active ? 'Active' : 'Inactive'}</span>; }
function Actions({ edit, remove }: { edit: () => void; remove: () => void }) { return <div className="flex justify-end gap-1"><button onClick={edit} className={actionBtnEdit}><Edit3 className="size-4" /></button><button onClick={remove} className={actionBtnDelete}><Trash2 className="size-4" /></button></div>; }
function Field({ label, value, set, optional }: { label: string; value: string; set: (value: string) => void; optional?: boolean }) { return <label className="text-xs font-semibold">{label}{!optional && ' *'}<input required={!optional} value={value} onChange={(event) => set(event.target.value)} className="mt-1.5 h-10 w-full rounded-xl border bg-background px-3" /></label>; }
function Select({ label, value, set, rows, labelKey = 'name', account }: { label: string; value: string; set: (value: string) => void; rows: Row[]; labelKey?: string; account?: boolean }) { return <label className="text-xs font-semibold">{label} *<select required value={value} onChange={(event) => set(event.target.value)} className="mt-1.5 h-10 w-full rounded-xl border bg-background px-3"><option value="">Select {label.toLowerCase()}</option>{rows.map((row) => <option key={row.id} value={row.id}>{account ? `${String(row.code || '')} — ${String(row.name || '')}` : String(row[labelKey] || row.name || '')}</option>)}</select></label>; }
function Toggle({ label, checked, set }: { label: string; checked: boolean; set: (value: boolean) => void }) { return <label className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={checked} onChange={(event) => set(event.target.checked)} className="size-4 accent-primary" />{label}</label>; }
