'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import PageHeader from '@/components/page-header';
import { authApi } from '@/lib/api/auth';

const ROLE_COLORS = ['bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300', 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300', 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'];

interface Permission { id: string; resource?: string; action: string; description?: string }
interface Role { id: string; name: string; description?: string; permissions?: Permission[] }

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPermissionIds, setFormPermissionIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Role | null>(null);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try { const res = await authApi.listRoles(); setRoles(res.data?.data || res.data || []); } catch { setRoles([]); } finally { setLoading(false); }
  }, []);

  const fetchPermissions = useCallback(async () => {
    try { const res = await authApi.listPermissions(); setPermissions(res.data?.data || res.data || []); } catch { setPermissions([]); }
  }, []);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    Promise.all([authApi.listRoles(), authApi.listPermissions()])
      .then(([rolesRes, permsRes]) => {
        if (!ignore) {
          setRoles(rolesRes.data?.data || rolesRes.data || []);
          setPermissions(permsRes.data?.data || permsRes.data || []);
        }
      })
      .catch(() => { if (!ignore) { setRoles([]); setPermissions([]); } })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, []);

  const openCreateModal = () => { setEditingRole(null); setFormName(''); setFormDescription(''); setFormPermissionIds([]); setModalOpen(true); };
  const openEditModal = (role: Role) => { setEditingRole(role); setFormName(role.name || ''); setFormDescription(role.description || ''); setFormPermissionIds((role.permissions || []).map((p) => p.id)); setModalOpen(true); };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      const body = { name: formName.trim(), description: formDescription.trim(), permissionIds: formPermissionIds };
      if (editingRole) await authApi.updateRole(editingRole.id, body); else await authApi.createRole(body);
      await fetchRoles(); setModalOpen(false);
    } catch { } finally { setSaving(false); }
  };

  const handleDelete = async (roleId: string) => { try { await authApi.deleteRole(roleId); setConfirmDelete(null); await fetchRoles(); } catch { } };

  const togglePermission = (permId: string) => {
    setFormPermissionIds((prev) => prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]);
  };

  const permissionsByResource = useMemo(() => {
    const groups: Record<string, Permission[]> = {};
    permissions.forEach((p) => { const resource = p.resource || 'general'; if (!groups[resource]) groups[resource] = []; groups[resource].push(p); });
    return groups;
  }, [permissions]);

  return (
    <div className="space-y-6">
      <PageHeader title="Roles" subtitle="Configure roles and their permissions" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">{roles.length} role{roles.length !== 1 ? 's' : ''} configured</p>
          <button onClick={openCreateModal} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Create Role
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><svg className="h-8 w-8 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>
        ) : roles.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-20 shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800">
            <svg className="h-12 w-12 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
            <p className="mt-3 text-sm font-medium text-gray-500 dark:text-gray-400">No roles configured</p>
            <button onClick={openCreateModal} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">Create Role</button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roles.map((role, idx) => {
              const colorClass = ROLE_COLORS[idx % ROLE_COLORS.length];
              const rolePerms = role.permissions || [];
              const isExpanded = expandedRole === role.id;
              return (
                <div key={role.id} className="group relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition hover:shadow-md dark:bg-gray-900 dark:ring-gray-800">
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-sm ${colorClass.split(' ').slice(0, 2).join(' ')}`}>
                          <svg className={`h-5 w-5 ${colorClass.split(' ')[1]}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-gray-900 dark:text-white">{role.name}</h3>
                          {role.description && <p className="mt-0.5 line-clamp-1 text-xs text-gray-500 dark:text-gray-400">{role.description}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                        <button onClick={() => openEditModal(role)} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300" title="Edit role">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                        </button>
                        <button onClick={() => setConfirmDelete(role)} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20" title="Delete role">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400"><span className="font-semibold text-gray-700 dark:text-gray-200">{rolePerms.length}</span> permission{rolePerms.length !== 1 ? 's' : ''}</span>
                      {rolePerms.length > 0 && <button onClick={() => setExpandedRole(isExpanded ? null : role.id)} className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400">{isExpanded ? 'Hide' : 'View'}</button>}
                    </div>
                  </div>
                  {isExpanded && rolePerms.length > 0 && (
                    <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-3 dark:border-gray-800 dark:bg-gray-800/50">
                      <div className="flex flex-wrap gap-1.5">
                        {rolePerms.map((p) => <span key={p.id} className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-gray-600 ring-1 ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700">{p.resource}:{p.action}</span>)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-gray-200/60 dark:bg-gray-900 dark:ring-gray-700">
              <button onClick={() => setModalOpen(false)} className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{editingRole ? 'Edit Role' : 'Create Role'}</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{editingRole ? 'Update role details and permissions' : 'Define a new role with permissions'}</p>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role Name</label>
                  <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Editor, Viewer, Manager" className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                  <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Brief description of this role..." rows={2} className="mt-1 w-full resize-none rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Permissions</label>
                  <p className="mt-0.5 text-xs text-gray-400">{formPermissionIds.length} selected</p>
                  <div className="mt-2 max-h-60 space-y-3 overflow-y-auto rounded-xl border border-gray-200 p-3 dark:border-gray-700">
                    {Object.entries(permissionsByResource).map(([resource, perms]) => (
                      <div key={resource}>
                        <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-gray-400">{resource}</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {perms.map((perm) => (
                            <label key={perm.id} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs transition ${formPermissionIds.includes(perm.id) ? 'border-blue-200 bg-blue-50 font-semibold text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 'border-gray-100 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'}`}>
                              <input type="checkbox" checked={formPermissionIds.includes(perm.id)} onChange={() => togglePermission(perm.id)} className="sr-only" />
                              <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${formPermissionIds.includes(perm.id) ? 'border-blue-500 bg-blue-500' : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700'}`}>
                                {formPermissionIds.includes(perm.id) && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                              </span>
                              {perm.action}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                    {permissions.length === 0 && <p className="py-4 text-center text-xs text-gray-400">No permissions available</p>}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button onClick={() => setModalOpen(false)} className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">Cancel</button>
                <button onClick={handleSave} disabled={!formName.trim() || saving} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                  {saving && <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                  {editingRole ? 'Update Role' : 'Create Role'}
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
                <div><h3 className="text-sm font-bold text-gray-900 dark:text-white">Delete Role</h3><p className="text-xs text-gray-500 dark:text-gray-400">This action cannot be undone</p></div>
              </div>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">Are you sure you want to delete the role <span className="font-semibold text-gray-900 dark:text-white">&ldquo;{confirmDelete.name}&rdquo;</span>?</p>
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
