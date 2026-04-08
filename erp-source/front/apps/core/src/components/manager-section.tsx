'use client';

import { useState, useEffect, useCallback } from 'react';
import { authApi } from '@/lib/api/auth';
import { Avatar } from '@erp/ui';

const SETTING_GROUPS = [
  {
    label: 'Notifications',
    fields: [
      { key: 'notifyMemberJoin', label: 'Member joins' },
      { key: 'notifyMemberLeave', label: 'Member leaves' },
      { key: 'notifyTaskAssigned', label: 'Task assigned' },
      { key: 'notifyApprovalRequest', label: 'Approval requests' },
      { key: 'notifyEscalation', label: 'Escalations' },
      { key: 'notifyReportReady', label: 'Reports ready' },
    ],
  },
  {
    label: 'Workflow',
    fields: [
      { key: 'autoApproveLeave', label: 'Auto-approve leave' },
      { key: 'autoApproveExpense', label: 'Auto-approve expense' },
    ],
  },
  {
    label: 'Visibility',
    fields: [
      { key: 'visibleInDirectory', label: 'Visible in directory' },
      { key: 'receiveWeeklySummary', label: 'Weekly summary email' },
    ],
  },
];

function RoleBadge({ role }: { role: string }) {
  const isManager = role === 'manager';
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${isManager ? 'bg-amber-50 text-amber-700' : 'bg-indigo-50 text-indigo-700'}`}>
      {isManager ? 'Manager' : 'Asst. Manager'}
    </span>
  );
}

interface ManagerSectionProps {
  orgId: string;
  entityType: string;
  entityId: string;
}

export default function ManagerSection({ orgId, entityType, entityId }: ManagerSectionProps) {
  const [managers, setManagers] = useState<{ id: string; userId: string; role: string }[]>([]);
  const [users, setUsers] = useState<{ id: string; firstName?: string; lastName?: string; email: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('manager');
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [settingsUserId, setSettingsUserId] = useState<string | null>(null);
  const [settings, setSettings] = useState<Record<string, boolean> | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchManagers = useCallback(async () => {
    try {
      const res = await authApi.listManagers(orgId, entityType, entityId);
      setManagers(res.data?.data || res.data || []);
    } catch { setManagers([]); } finally { setLoading(false); }
  }, [orgId, entityType, entityId]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await authApi.listUsers();
      const d = res.data?.data;
      setUsers(Array.isArray(d) ? d : d?.users || []);
    } catch { setUsers([]); }
  }, []);

  useEffect(() => { fetchManagers(); fetchUsers(); }, [fetchManagers, fetchUsers]);

  const handleAssign = async () => {
    if (!selectedUserId) return;
    setAssigning(true);
    try {
      await authApi.assignManager(orgId, entityType, entityId, { userId: selectedUserId, role: selectedRole });
      setShowAssignForm(false);
      setSelectedUserId('');
      setSelectedRole('manager');
      fetchManagers();
    } catch { /* noop */ } finally { setAssigning(false); }
  };

  const handleUnassign = async (assignmentId: string) => {
    try {
      await authApi.unassignManager(orgId, entityType, entityId, assignmentId);
      fetchManagers();
      if (settingsUserId) setSettingsUserId(null);
    } catch { /* noop */ }
  };

  const openSettings = async (userId: string) => {
    setSettingsUserId(userId);
    try {
      const res = await authApi.getManagerSettings(orgId, userId, { entityType, entityId });
      setSettings(res.data?.data || res.data);
    } catch { setSettings(null); }
  };

  const toggleSetting = (key: string) => {
    setSettings((prev) => prev ? { ...prev, [key]: !prev[key] } : prev);
  };

  const saveSettings = async () => {
    if (!settings || !settingsUserId) return;
    setSavingSettings(true);
    try {
      await authApi.updateManagerSettings(orgId, settingsUserId, { entityType, entityId, ...settings });
    } catch { /* noop */ } finally { setSavingSettings(false); }
  };

  const getUserName = (userId: string) => {
    const u = users.find((u) => u.id === userId);
    if (!u) return userId.slice(0, 8) + '…';
    return [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email;
  };

  const getUserEmail = (userId: string) => users.find((u) => u.id === userId)?.email || '';

  const manager = managers.find((m) => m.role === 'manager');
  const assistants = managers.filter((m) => m.role === 'assistant_manager');
  const availableUsers = users.filter((u) => !managers.some((m) => m.userId === u.id && m.role === selectedRole));

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-sm ring-1 ring-gray-100 dark:ring-gray-700">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">Management</h2>
        <button onClick={() => setShowAssignForm(!showAssignForm)} className="rounded-lg bg-accent-50 px-3 py-1.5 text-xs font-semibold text-accent-600 transition hover:bg-accent-100">
          {showAssignForm ? 'Cancel' : '+ Assign'}
        </button>
      </div>

      {showAssignForm && (
        <div className="mt-4 rounded-xl border border-accent-100 bg-accent-50/40 p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <select value={selectedRole} onChange={(e) => { setSelectedRole(e.target.value); setSelectedUserId(''); }} className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm dark:text-white">
              <option value="manager">Manager</option>
              <option value="assistant_manager">Assistant Manager</option>
            </select>
            <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="flex-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm dark:text-white">
              <option value="">Select user…</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>{[u.firstName, u.lastName].filter(Boolean).join(' ') || u.email}</option>
              ))}
            </select>
            <button onClick={handleAssign} disabled={!selectedUserId || assigning} className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-700 disabled:opacity-50">
              {assigning ? 'Assigning…' : 'Assign'}
            </button>
          </div>
          {selectedRole === 'manager' && manager && (
            <p className="mt-2 text-xs text-amber-600">This will replace the current manager.</p>
          )}
        </div>
      )}

      <div className="mt-5">
        <h3 className="mb-2 text-xs font-semibold text-gray-500">Manager</h3>
        {manager ? (
          <div className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-gray-700 px-4 py-3">
            <div className="flex items-center gap-3">
              <Avatar name={getUserName(manager.userId)} size="sm" shape="circular" />
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{getUserName(manager.userId)}</p>
                <p className="text-xs text-gray-400">{getUserEmail(manager.userId)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RoleBadge role="manager" />
              <button onClick={() => openSettings(manager.userId)} title="Settings" className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </button>
              <button onClick={() => handleUnassign(manager.id)} title="Remove" className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-gray-200 dark:border-gray-700 py-4">
            <p className="text-xs text-gray-400">No manager assigned</p>
          </div>
        )}
      </div>

      <div className="mt-5">
        <h3 className="mb-2 text-xs font-semibold text-gray-500">
          Assistant Managers
          <span className="ml-1 rounded-full bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">{assistants.length}</span>
        </h3>
        {assistants.length === 0 ? (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-gray-200 dark:border-gray-700 py-4">
            <p className="text-xs text-gray-400">No assistant managers</p>
          </div>
        ) : (
          <div className="space-y-2">
            {assistants.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-gray-700 px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={getUserName(a.userId)} size="sm" shape="circular" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{getUserName(a.userId)}</p>
                    <p className="text-xs text-gray-400">{getUserEmail(a.userId)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <RoleBadge role="assistant_manager" />
                  <button onClick={() => openSettings(a.userId)} title="Settings" className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </button>
                  <button onClick={() => handleUnassign(a.id)} title="Remove" className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {settingsUserId && settings && (
        <div className="mt-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Settings — {getUserName(settingsUserId)}</h3>
            <button onClick={() => setSettingsUserId(null)} className="text-gray-400 hover:text-gray-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="mt-4 space-y-5">
            {SETTING_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">{group.label}</p>
                <div className="space-y-1">
                  {group.fields.map((field) => (
                    <label key={field.key} className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 transition hover:bg-white dark:hover:bg-gray-800">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{field.label}</span>
                      <button type="button" role="switch" aria-checked={!!settings[field.key]} onClick={() => toggleSetting(field.key)} className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors ${settings[field.key] ? 'bg-accent-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${settings[field.key] ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </button>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-end">
            <button onClick={saveSettings} disabled={savingSettings} className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-700 disabled:opacity-50">
              {savingSettings ? 'Saving…' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="mt-4 flex justify-center">
          <svg className="h-5 w-5 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}
    </div>
  );
}
