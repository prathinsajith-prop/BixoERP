'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Input, Stats, Textarea, PageHeader, RolesCardSkeleton } from '@erp/ui';
import { authApi } from '@/lib/api/auth';
import { showToast } from '@erp/shell';

const ROLE_COLORS = ['bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300', 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300', 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'];

const Icons = {
  shield: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>,
  lock: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>,
  key: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>,
  star: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.499z" /></svg>,
  search: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>,
};

interface Permission { id: string; resource?: string; action: string; description?: string; code?: string }
interface Role { id: string; name: string; description?: string; permissions?: string[]; isSystem?: boolean }

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleSearch, setRoleSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPermissionIds, setFormPermissionIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Role | null>(null);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [permSearch, setPermSearch] = useState('');

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
    // Fetch independently so a permissions 403 does not wipe out the roles list
    authApi.listRoles()
      .then((res) => { if (!ignore) setRoles(res.data?.data || res.data || []); })
      .catch(() => { if (!ignore) setRoles([]); })
      .finally(() => { if (!ignore) setLoading(false); });
    authApi.listPermissions()
      .then((res) => { if (!ignore) setPermissions(res.data?.data || res.data || []); })
      .catch(() => { if (!ignore) setPermissions([]); });
    return () => { ignore = true; };
  }, []);

  const openCreateModal = () => { setEditingRole(null); setFormName(''); setFormDescription(''); setFormPermissionIds([]); setPermSearch(''); setModalOpen(true); };
  const openEditModal = (role: Role) => { setEditingRole(role); setFormName(role.name || ''); setFormDescription(role.description || ''); setFormPermissionIds(role.permissions || []); setPermSearch(''); setModalOpen(true); };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      const body = { name: formName.trim(), description: formDescription.trim(), permissionIds: formPermissionIds };
      if (editingRole) await authApi.updateRole(editingRole.id, body); else await authApi.createRole(body);
      showToast.success(editingRole ? 'Role updated' : 'Role created');
      await fetchRoles(); setModalOpen(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed to save role. Please try again.';
      showToast.error('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (roleId: string) => { try { await authApi.deleteRole(roleId); showToast.success('Role deleted'); setConfirmDelete(null); await fetchRoles(); } catch { showToast.error('Error', 'Failed to delete role'); } };

  const togglePermission = (permId: string) => {
    setFormPermissionIds((prev) => prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]);
  };

  const permissionsByResource = useMemo(() => {
    const q = permSearch.toLowerCase();
    const groups: Record<string, Permission[]> = {};
    permissions
      .filter((p) => !q || (p.resource || '').toLowerCase().includes(q) || p.action.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q))
      .forEach((p) => { const resource = p.resource || 'general'; if (!groups[resource]) groups[resource] = []; groups[resource].push(p); });
    return groups;
  }, [permissions, permSearch]);

  const toggleAllInResource = (perms: Permission[]) => {
    const allSelected = perms.every((p) => formPermissionIds.includes(p.id));
    setFormPermissionIds((prev) =>
      allSelected ? prev.filter((id) => !perms.some((p) => p.id === id)) : [...new Set([...prev, ...perms.map((p) => p.id)])],
    );
  };

  const filteredRoles = useMemo(() => {
    if (!roleSearch.trim()) return roles;
    const q = roleSearch.toLowerCase();
    return roles.filter((r) => r.name.toLowerCase().includes(q) || (r.description ?? '').toLowerCase().includes(q));
  }, [roles, roleSearch]);

  const roleStats = useMemo(() => ({
    total: roles.length,
    permissions: permissions.length,
    withPerms: roles.filter((r) => (r.permissions?.length ?? 0) > 0).length,
    noPerms: roles.filter((r) => (r.permissions?.length ?? 0) === 0).length,
  }), [roles, permissions]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & Permissions"
        description="Configure roles and their access permissions"
        actions={
          <button onClick={openCreateModal} className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90" style={{ backgroundColor: 'var(--gogo-primary)' }}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Create Role
          </button>
        }
      />

      {/* Stats */}
      <Stats
        columns={4}
        metrics={[
          { label: 'Total Roles', value: roleStats.total, icon: Icons.shield, color: 'secondary' },
          { label: 'Total Permissions', value: roleStats.permissions, icon: Icons.key, color: 'info' },
          { label: 'Roles with Access', value: roleStats.withPerms, icon: Icons.lock, color: 'success' },
          { label: 'Empty Roles', value: roleStats.noPerms, icon: Icons.star, color: 'warning' },
        ]}
      />

      {/* Search + meta row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[var(--gogo-text-secondary)]">{Icons.search}</span>
          <input
            type="text"
            placeholder="Search roles by name or description…"
            value={roleSearch}
            onChange={(e) => setRoleSearch(e.target.value)}
            className="w-full rounded-lg border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] py-2 pl-9 pr-9 text-sm text-[var(--gogo-text-primary)] placeholder-[var(--gogo-text-secondary)] shadow-[var(--shadow-card)] outline-none focus:border-[var(--gogo-primary)] focus:ring-1 focus:ring-[var(--gogo-primary)]"
          />
          {roleSearch && (
            <button
              onClick={() => setRoleSearch('')}
              className="absolute inset-y-0 right-2 flex items-center p-1 text-[var(--gogo-text-secondary)] hover:text-[var(--gogo-text-primary)]"
              title="Clear search"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {roleSearch && (
            <p className="text-xs text-[var(--gogo-text-secondary)]">
              <strong>{filteredRoles.length}</strong> of {roles.length} role{roles.length !== 1 ? 's' : ''}
            </p>
          )}
          <button
            onClick={() => { fetchRoles(); fetchPermissions(); }}
            title="Refresh"
            className="flex items-center justify-center rounded-lg border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] p-2 text-[var(--gogo-text-secondary)] transition hover:bg-[var(--gogo-surface-hover)] shadow-[var(--shadow-card)]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" /></svg>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <RolesCardSkeleton cards={6} />
        ) : filteredRoles.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] py-20 shadow-[var(--shadow-card)]">
            <svg className="h-12 w-12 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
            <p className="mt-3 text-sm font-medium text-[var(--gogo-text-secondary)]">{roleSearch ? 'No roles match your search' : 'No roles configured'}</p>
            {!roleSearch && <button onClick={openCreateModal} className="mt-4 rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90" style={{ backgroundColor: 'var(--gogo-primary)' }}>Create Role</button>}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRoles.map((role, idx) => {
              const colorClass = ROLE_COLORS[idx % ROLE_COLORS.length];
              const rolePerms = role.permissions || [];
              const isExpanded = expandedRole === role.id;
              return (
                <div key={role.id} className="group relative rounded-[var(--radius-card)] border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] shadow-[var(--shadow-card)] transition hover:shadow-md">
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm sm:h-10 sm:w-10 ${colorClass.split(' ').slice(0, 2).join(' ')}`}>
                          <svg className={`h-4 w-4 sm:h-5 sm:w-5 ${colorClass.split(' ')[1]}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-bold text-[var(--gogo-text-primary)]">{role.name}</h3>
                          {role.description && <p className="mt-0.5 line-clamp-1 text-xs text-[var(--gogo-text-secondary)]">{role.description}</p>}
                        </div>
                      </div>
                      <div className="ml-2 flex shrink-0 items-center gap-1 md:opacity-0 md:transition md:group-hover:opacity-100">
                        <button onClick={() => openEditModal(role)} className="rounded-lg p-1.5 text-[var(--gogo-text-secondary)] transition hover:bg-[var(--gogo-divider)] hover:text-[var(--gogo-text-primary)]" title="Edit role">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                        </button>
                        <button onClick={() => setConfirmDelete(role)} className="rounded-lg p-1.5 text-[var(--gogo-text-secondary)] transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20" title="Delete role">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-[var(--gogo-text-secondary)]"><span className="font-semibold text-[var(--gogo-text-primary)]">{rolePerms.length}</span> permission{rolePerms.length !== 1 ? 's' : ''}</span>
                      {rolePerms.length > 0 && <button onClick={() => setExpandedRole(isExpanded ? null : role.id)} className="text-xs font-medium hover:opacity-80" style={{ color: 'var(--gogo-primary)' }}>{isExpanded ? 'Hide' : 'View'}</button>}
                    </div>
                  </div>
                  {isExpanded && rolePerms.length > 0 && (
                    <div className="border-t border-[var(--gogo-divider)] bg-[var(--gogo-divider)]/40 px-5 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {rolePerms.map((pid) => {
                          const perm = permissions.find((p) => p.id === pid);
                          const label = perm ? `${perm.resource}:${perm.action}` : pid.slice(0, 8) + '…';
                          return <span key={pid} className="inline-flex items-center rounded-full border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] px-2 py-0.5 text-xs font-medium text-[var(--gogo-text-secondary)]">{label}</span>;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center">
            <div className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[var(--radius-card)] border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] shadow-2xl sm:max-h-[90vh] sm:max-w-lg sm:rounded-[var(--radius-card)]">
              {/* Drag handle on mobile */}
              <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-[var(--gogo-divider)] sm:hidden" />
              <button onClick={() => setModalOpen(false)} className="absolute right-4 top-4 rounded-lg p-1 text-[var(--gogo-text-secondary)] transition hover:bg-[var(--gogo-divider)] hover:text-[var(--gogo-text-primary)]">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <div className="shrink-0 px-6 pb-2 pt-5">
                <h3 className="text-lg font-bold text-[var(--gogo-text-primary)]">{editingRole ? 'Edit Role' : 'Create Role'}</h3>
                <p className="mt-1 text-sm text-[var(--gogo-text-secondary)]">{editingRole ? 'Update role details and permissions' : 'Define a new role with permissions'}</p>
              </div>              <div className="min-h-0 flex-1 overflow-y-auto px-6">
                <div className="space-y-4 py-2">
                  <div>
                    <Input label="Role Name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Editor, Viewer, Manager" />
                  </div>
                  <div>
                    <Textarea label="Description" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Brief description of this role..." rows={2} />
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-[var(--gogo-text-primary)]">Permissions</label>
                        <p className="mt-0.5 text-xs text-[var(--gogo-text-secondary)]">
                          {formPermissionIds.length} of {permissions.length} selected
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setFormPermissionIds(permissions.map((p) => p.id))} className="rounded-md px-2 py-1 text-xs font-medium hover:opacity-80" style={{ color: 'var(--gogo-primary)' }}>All</button>
                        <button type="button" onClick={() => setFormPermissionIds([])} className="rounded-md px-2 py-1 text-xs font-medium text-[var(--gogo-text-secondary)] hover:bg-[var(--gogo-divider)]">None</button>
                      </div>
                    </div>
                    {/* Permission search */}
                    <div className="relative mb-2">
                      <svg className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--gogo-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                      <input type="text" value={permSearch} onChange={(e) => setPermSearch(e.target.value)} placeholder="Filter permissions…" className="w-full rounded-lg border border-[var(--gogo-divider)] bg-[var(--gogo-divider)]/40 py-1.5 pl-8 pr-3 text-xs text-[var(--gogo-text-primary)] placeholder:text-[var(--gogo-text-secondary)] outline-none focus:border-[var(--gogo-primary)] focus:ring-1 focus:ring-[var(--gogo-primary)]" />
                    </div>
                    <div className="max-h-64 space-y-3 overflow-y-auto rounded-[var(--radius-card)] border border-[var(--gogo-divider)] bg-[var(--gogo-divider)]/30 p-3">
                      {Object.entries(permissionsByResource).length === 0 && (
                        <p className="py-4 text-center text-xs text-[var(--gogo-text-secondary)]">{permissions.length === 0 ? 'No permissions available' : 'No matching permissions'}</p>
                      )}
                      {Object.entries(permissionsByResource).map(([resource, perms]) => {
                        const allSelected = perms.every((p) => formPermissionIds.includes(p.id));
                        const someSelected = perms.some((p) => formPermissionIds.includes(p.id));
                        return (
                          <div key={resource}>
                            <div className="mb-1.5 flex items-center justify-between">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--gogo-text-secondary)]">{resource}</p>
                              <button type="button" onClick={() => toggleAllInResource(perms)} className={`text-[10px] font-medium transition ${allSelected ? 'hover:opacity-80' : someSelected ? 'text-amber-600 hover:text-amber-800 dark:text-amber-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`} style={allSelected ? { color: 'var(--gogo-primary)' } : undefined}>
                                {allSelected ? 'Deselect all' : 'Select all'}
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {perms.map((perm) => {
                                const selected = formPermissionIds.includes(perm.id);
                                const code = perm.code || `${perm.resource}:${perm.action}`;
                                return (
                                  <button key={perm.id} type="button" onClick={() => togglePermission(perm.id)} title={perm.description || code} className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${selected ? '' : 'border-[var(--gogo-divider)] bg-[var(--gogo-surface)] text-[var(--gogo-text-secondary)] hover:border-[var(--gogo-primary)] hover:bg-[var(--gogo-divider)]'}`} style={selected ? { borderColor: 'color-mix(in srgb, var(--gogo-primary) 30%, transparent)', backgroundColor: 'color-mix(in srgb, var(--gogo-primary) 10%, transparent)', color: 'var(--gogo-primary)' } : undefined}>
                                    <span className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${selected ? 'border-transparent' : 'border-[var(--gogo-divider)]'}`} style={selected ? { backgroundColor: 'var(--gogo-primary)', borderColor: 'var(--gogo-primary)' } : undefined}>
                                      {selected && <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                                    </span>
                                    {perm.action}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="shrink-0 border-t border-[var(--gogo-divider)] px-6 py-4">
                <div className="flex items-center justify-end gap-3">
                  <button onClick={() => setModalOpen(false)} className="rounded-lg border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] px-4 py-2.5 text-sm font-medium text-[var(--gogo-text-primary)] transition hover:bg-[var(--gogo-divider)]">Cancel</button>
                  <button onClick={handleSave} disabled={!formName.trim() || saving} className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50" style={{ backgroundColor: 'var(--gogo-primary)' }}>
                    {saving && <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                    {editingRole ? 'Update Role' : 'Create Role'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-[var(--radius-card)] border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] p-6 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30"><svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg></div>
                <div><h3 className="text-sm font-bold text-[var(--gogo-text-primary)]">Delete Role</h3><p className="text-xs text-[var(--gogo-text-secondary)]">This action cannot be undone</p></div>
              </div>
              <p className="mt-4 text-sm text-[var(--gogo-text-secondary)]">Are you sure you want to delete the role <span className="font-semibold text-[var(--gogo-text-primary)]">&ldquo;{confirmDelete.name}&rdquo;</span>?</p>
              <div className="mt-5 flex items-center justify-end gap-3">
                <button onClick={() => setConfirmDelete(null)} className="rounded-lg border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] px-4 py-2 text-sm font-medium text-[var(--gogo-text-primary)] transition hover:bg-[var(--gogo-divider)]">Cancel</button>
                <button onClick={() => handleDelete(confirmDelete.id)} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700">Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
