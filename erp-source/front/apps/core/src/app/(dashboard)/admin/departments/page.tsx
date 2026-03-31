'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/page-header';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';

interface Department { id: string; name: string; code: string; description?: string; divisionId?: string; status: string }
interface Division { id: string; name: string }

function StatusBadge({ status }: { status: string }) {
  const isActive = status === 'ACTIVE';
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${isActive ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>{status}</span>;
}

export default function DepartmentsPage() {
  const router = useRouter();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [items, setItems] = useState<Department[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', description: '', divisionId: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setOrgId(localStorage.getItem('organizationId') || localStorage.getItem('tenantId')); }, []);

  useEffect(() => {
    if (!orgId) return;
    setLoading(true);
    Promise.all([authApi.listDepartments(orgId), authApi.listDivisions(orgId)])
      .then(([deptRes, divRes]) => { setItems(deptRes.data?.data || []); setDivisions(divRes.data?.data || []); })
      .catch(() => { setItems([]); setDivisions([]); })
      .finally(() => setLoading(false));
  }, [orgId]);

  const divisionName = (divId?: string) => divisions.find((d) => d.id === divId)?.name || '—';
  const resetForm = () => { setForm({ name: '', code: '', description: '', divisionId: '' }); setEditingId(null); setShowForm(false); };

  const handleSubmit = async () => {
    if (!form.name || !form.code || !orgId) return;
    setSaving(true);
    const body = { ...form, divisionId: form.divisionId || null };
    try {
      if (editingId) { const res = await authApi.updateDepartment(orgId, editingId, body); setItems(items.map((d) => (d.id === editingId ? res.data?.data : d))); }
      else { const res = await authApi.createDepartment(orgId, body); setItems([...items, res.data?.data]); }
      resetForm();
    } catch { /* handled */ } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!orgId || !confirm('Delete this department? Teams under it will become unassigned.')) return;
    try { await authApi.deleteDepartment(orgId, id); setItems(items.filter((d) => d.id !== id)); } catch { /* handled */ }
  };

  const startEdit = (item: Department) => { setForm({ name: item.name, code: item.code, description: item.description || '', divisionId: item.divisionId || '' }); setEditingId(item.id); setShowForm(true); };

  if (!orgId) return (<div className="flex min-h-[60vh] items-center justify-center"><p className="text-sm text-gray-500 dark:text-gray-400">No organization selected. Go to Organization Settings first.</p></div>);

  return (
    <div className="space-y-6">
        <PageHeader title="Departments" subtitle="Manage departments within divisions" />
        <div className="mb-6 flex justify-end">
          <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">+ Add Department</button>
        </div>

        {showForm && (
          <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50/50 p-5 dark:border-blue-800 dark:bg-blue-900/20">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label><input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Backend Engineering" /></div>
              <div><label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Code</label><input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="BE" maxLength={50} /></div>
              <div><label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Division</label><select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white" value={form.divisionId} onChange={(e) => setForm({ ...form, divisionId: e.target.value })}><option value="">— No division —</option>{divisions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
              <div><label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label><input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Backend development team" /></div>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={handleSubmit} disabled={saving} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving…' : editingId ? 'Update' : 'Create'}</button>
              <button onClick={resetForm} className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">Cancel</button>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          {loading ? (
            <div className="flex items-center justify-center py-16"><div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /></div>
          ) : items.length === 0 && !showForm ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800"><svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" /></svg></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">No departments yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Name</th>
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Code</th>
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Division</th>
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Description</th>
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
                  <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {items.map((item) => (
                    <tr key={item.id} className="group">
                      <td className="py-3 text-sm font-medium"><button onClick={() => router.push(`/admin/departments`)} className="text-blue-600 transition hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300">{item.name}</button></td>
                      <td className="py-3"><span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">{item.code}</span></td>
                      <td className="py-3 text-sm text-gray-500 dark:text-gray-400">{divisionName(item.divisionId)}</td>
                      <td className="max-w-xs truncate py-3 text-sm text-gray-500 dark:text-gray-400">{item.description || '—'}</td>
                      <td className="py-3"><StatusBadge status={item.status} /></td>
                      <td className="py-3 text-right"><div className="flex justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                        <button onClick={() => startEdit(item)} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg></button>
                        <button onClick={() => handleDelete(item.id)} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
  );
}
