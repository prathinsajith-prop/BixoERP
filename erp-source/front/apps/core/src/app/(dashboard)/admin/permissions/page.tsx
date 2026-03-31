'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import PageHeader from '@/components/page-header';
import { authApi } from '@/lib/api/auth';

const RESOURCE_COLORS: Record<string, string> = {
  users: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  roles: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  organizations: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  billing: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  settings: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  reports: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
};
const getResourceColor = (resource: string) => RESOURCE_COLORS[resource] || 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400';

interface Permission { id: string; resource?: string; action: string; description?: string }

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formResource, setFormResource] = useState('');
  const [formAction, setFormAction] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Permission | null>(null);
  const [search, setSearch] = useState('');

  const fetchPermissions = useCallback(async () => {
    setLoading(true);
    try { const res = await authApi.listPermissions(); setPermissions(res.data?.data || res.data || []); } catch { setPermissions([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPermissions(); }, [fetchPermissions]);

  const handleCreate = async () => {
    if (!formResource.trim() || !formAction.trim()) return;
    setSaving(true);
    try {
      await authApi.createPermission({ resource: formResource.trim(), action: formAction.trim(), description: formDescription.trim() });
      await fetchPermissions(); setModalOpen(false); setFormResource(''); setFormAction(''); setFormDescription('');
    } catch {} finally { setSaving(false); }
  };

  const handleDelete = async (permId: string) => { try { await authApi.deletePermission(permId); setConfirmDelete(null); await fetchPermissions(); } catch {} };

  const grouped = useMemo(() => {
    const groups: Record<string, Permission[]> = {};
    const q = search.toLowerCase();
    permissions.filter((p) => !search || p.resource?.toLowerCase().includes(q) || p.action?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)).forEach((p) => {
      const resource = p.resource || 'general';
      if (!groups[resource]) groups[resource] = [];
      groups[resource].push(p);
    });
    return groups;
  }, [permissions, search]);

  return (
    <div className="space-y-6">
        <PageHeader title="Permissions" subtitle="Manage system permissions and access control" />

        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search permissions..." className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500" />
            </div>
            <button onClick={() => setModalOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              Create Permission
            </button>
          </div>

          <div className="flex items-center gap-4">
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">{permissions.length} permission{permissions.length !== 1 ? 's' : ''}</span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">{Object.keys(grouped).length} resource{Object.keys(grouped).length !== 1 ? 's' : ''}</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20"><svg className="h-8 w-8 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-20 shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800">
              <svg className="h-12 w-12 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>
              <p className="mt-3 text-sm font-medium text-gray-500 dark:text-gray-400">No permissions found</p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{search ? 'Try adjusting your search' : 'Create your first permission to get started'}</p>
              {!search && <button onClick={() => setModalOpen(true)} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">Create Permission</button>}
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(grouped).map(([resource, perms]) => (
                <div key={resource} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800">
                  <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/50 px-5 py-3 dark:border-gray-800 dark:bg-gray-800/50">
                    <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${getResourceColor(resource)}`}>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>
                    </span>
                    <div><h3 className="text-sm font-bold capitalize text-gray-900 dark:text-white">{resource}</h3><p className="text-xs text-gray-500 dark:text-gray-400">{perms.length} action{perms.length !== 1 ? 's' : ''}</p></div>
                  </div>
                  <div className="divide-y divide-gray-50 dark:divide-gray-800">
                    {perms.map((perm) => (
                      <div key={perm.id} className="group flex items-center justify-between px-5 py-3 transition hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">{perm.action}</span>
                          {perm.description && <span className="text-xs text-gray-500 dark:text-gray-400">{perm.description}</span>}
                        </div>
                        <button onClick={() => setConfirmDelete(perm)} className="rounded-lg p-1.5 text-gray-400 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-900/20" title="Delete permission">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {modalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-gray-200/60 dark:bg-gray-900 dark:ring-gray-700">
                <button onClick={() => { setModalOpen(false); setFormResource(''); setFormAction(''); setFormDescription(''); }} className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Create Permission</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Define a new permission for resource access control</p>
                <div className="mt-5 space-y-4">
                  <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Resource</label><input type="text" value={formResource} onChange={(e) => setFormResource(e.target.value)} placeholder="e.g. users, roles, billing" className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Action</label><input type="text" value={formAction} onChange={(e) => setFormAction(e.target.value)} placeholder="e.g. create, read, update, delete" className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label><textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Brief description of what this permission allows..." rows={2} className="mt-1 w-full resize-none rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white" /></div>
                </div>
                <div className="mt-6 flex items-center justify-end gap-3">
                  <button onClick={() => { setModalOpen(false); setFormResource(''); setFormAction(''); setFormDescription(''); }} className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">Cancel</button>
                  <button onClick={handleCreate} disabled={!formResource.trim() || !formAction.trim() || saving} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                    {saving && <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                    Create Permission
                  </button>
                </div>
              </div>
            </div>
          )}

          {confirmDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-gray-200/60 dark:bg-gray-900 dark:ring-gray-700">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30"><svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg></div>
                  <div><h3 className="text-sm font-bold text-gray-900 dark:text-white">Delete Permission</h3><p className="text-xs text-gray-500 dark:text-gray-400">This may affect roles using this permission</p></div>
                </div>
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">Delete permission <span className="font-semibold text-gray-900 dark:text-white">&ldquo;{confirmDelete.resource}:{confirmDelete.action}&rdquo;</span>?</p>
                <div className="mt-5 flex items-center justify-end gap-3">
                  <button onClick={() => setConfirmDelete(null)} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">Cancel</button>
                  <button onClick={() => handleDelete(confirmDelete.id)} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700">Delete</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
  );
}
