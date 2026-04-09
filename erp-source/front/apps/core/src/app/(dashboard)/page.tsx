'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@erp/ui';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { authApi } from '@/lib/api/auth';
import { useOrgContext } from '@/context/org';

function decodeToken(token: string) {
  try { return JSON.parse(atob(token.split('.')[1])); } catch { return null; }
}

function StatCard({ label, value, icon, iconBg, loading }: {
  label: string; value: string | number; icon: React.ReactNode; iconBg?: string; loading?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md sm:p-5 dark:bg-gray-800 dark:ring-gray-700">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium leading-tight text-gray-500 sm:text-sm dark:text-gray-400">{label}</span>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10 ${iconBg || 'bg-[color-mix(in_srgb,var(--gogo-primary)_10%,transparent)] text-[var(--gogo-primary)]'}`}>{icon}</span>
      </div>
      {loading ? (
        <div className="mt-2 h-7 w-14 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-700" />
      ) : (
        <p className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">{value}</p>
      )}
    </div>
  );
}

function ActivityItem({ actor, action, time, resource }: {
  actor: string; action: string; time: string; resource?: string;
}) {
  const initials = actor.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '??';
  const colors = ['bg-blue-500', 'bg-violet-500', 'bg-amber-500', 'bg-emerald-500', 'bg-rose-500', 'bg-cyan-500'];
  const color = colors[initials.charCodeAt(0) % colors.length];
  return (
    <div className="flex items-start gap-3 rounded-xl p-3 transition hover:bg-gray-50 dark:hover:bg-white/5">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${color}`}>{initials}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-900 dark:text-gray-100">
          <span className="font-semibold">{actor}</span>{' '}{action}
          {resource && <span className="font-medium text-gray-600 dark:text-gray-300"> {resource}</span>}
        </p>
        <p className="mt-0.5 text-xs text-gray-400">{time}</p>
      </div>
    </div>
  );
}

function QuickAction({ icon, label, description, onClick }: {
  icon: React.ReactNode; label: string; description: string; onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className="group flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-4 text-left transition hover:border-[var(--gogo-primary)] hover:shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:hover:border-[var(--gogo-primary)]">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-600 transition group-hover:text-[var(--gogo-primary)] dark:bg-gray-700 dark:text-gray-300">{icon}</span>
      <div>
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{label}</p>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{description}</p>
      </div>
    </button>
  );
}

function formatRelativeTime(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  } catch { return ''; }
}

interface AuditEntry {
  id: string;
  actorName?: string;
  actorEmail?: string;
  action: string;
  resourceType?: string;
  resourceName?: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { accessToken } = useAuthStore();
  const router = useRouter();
  const { orgId } = useOrgContext();
  const [greeting, setGreeting] = useState('Hello');

  const user = accessToken ? decodeToken(accessToken) : null;
  const fallbackName = user?.email?.split('@')[0] ?? 'User';
  const [displayName, setDisplayName] = useState(fallbackName);

  const [statsLoading, setStatsLoading] = useState(true);
  const [memberCount, setMemberCount] = useState(0);
  const [pendingInvites, setPendingInvites] = useState(0);
  const [divisionCount, setDivisionCount] = useState(0);
  const [departmentCount, setDepartmentCount] = useState(0);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(true);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  useEffect(() => {
    authApi.getProfile()
      .then(({ data }: { data: { data?: { user?: { firstName?: string; lastName?: string } } } }) => {
        const u = data.data?.user;
        if (u) {
          const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ');
          if (fullName) setDisplayName(fullName);
        }
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    if (!orgId) return;
    setStatsLoading(true);
    Promise.allSettled([
      authApi.listOrganizationMembers(orgId),
      authApi.listPendingInvites(orgId),
      authApi.listDivisions(orgId),
      authApi.listDepartments(orgId),
    ]).then(([membersRes, invitesRes, divsRes, deptsRes]) => {
      if (membersRes.status === 'fulfilled') {
        const d = membersRes.value.data?.data;
        setMemberCount(Array.isArray(d) ? d.length : (d?.total ?? 0));
      }
      if (invitesRes.status === 'fulfilled') {
        const d = invitesRes.value.data?.data;
        setPendingInvites(Array.isArray(d) ? d.length : (d?.total ?? 0));
      }
      if (divsRes.status === 'fulfilled') {
        const d = divsRes.value.data?.data;
        setDivisionCount(Array.isArray(d) ? d.length : (d?.total ?? 0));
      }
      if (deptsRes.status === 'fulfilled') {
        const d = deptsRes.value.data?.data;
        setDepartmentCount(Array.isArray(d) ? d.length : (d?.total ?? 0));
      }
    }).finally(() => setStatsLoading(false));
  }, [orgId]);

  useEffect(() => {
    if (!orgId) return;
    setAuditLoading(true);
    authApi.getAuditLog(orgId, { limit: 10 })
      .then(({ data }: { data: any }) => {
        const entries: AuditEntry[] = data?.data?.entries ?? data?.data ?? [];
        setAuditLog(Array.isArray(entries) ? entries : []);
      })
      .catch(() => setAuditLog([]))
      .finally(() => setAuditLoading(false));
  }, [orgId]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting}, ${displayName}`}
        description="Here's an overview of your organisation"
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard loading={statsLoading} label="Members" value={memberCount}
          iconBg="bg-violet-50 text-violet-600"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>}
        />
        <StatCard loading={statsLoading} label="Pending Invites" value={pendingInvites}
          iconBg="bg-amber-50 text-amber-600"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>}
        />
        <StatCard loading={statsLoading} label="Divisions" value={divisionCount}
          iconBg="bg-[color-mix(in_srgb,var(--gogo-primary)_10%,transparent)] text-[var(--gogo-primary)]"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>}
        />
        <StatCard loading={statsLoading} label="Departments" value={departmentCount}
          iconBg="bg-emerald-50 text-emerald-600"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" /></svg>}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
            <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ backgroundColor: 'color-mix(in srgb, var(--gogo-primary) 10%, transparent)', color: 'var(--gogo-primary)' }}>Audit log</span>
          </div>
          {auditLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <div className="h-9 w-9 animate-pulse rounded-full bg-gray-100 dark:bg-gray-700" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-3/4 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
                    <div className="h-2.5 w-1/4 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
                  </div>
                </div>
              ))}
            </div>
          ) : auditLog.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">No recent activity.</p>
          ) : (
            <div className="space-y-1">
              {auditLog.map((entry) => (
                <ActivityItem
                  key={entry.id}
                  actor={entry.actorName ?? entry.actorEmail ?? 'System'}
                  action={entry.action.toLowerCase().replace(/_/g, ' ')}
                  resource={entry.resourceName}
                  time={formatRelativeTime(entry.createdAt)}
                />
              ))}
            </div>
          )}
        </div>

        {/* System Status */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
          <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">System Status</h2>
          <div className="space-y-3">
            {[
              { label: 'API Gateway', status: 'Operational' },
              { label: 'Database', status: 'Operational' },
              { label: 'Auth Service', status: 'Operational' },
              { label: 'File Storage', status: 'Operational' },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">{s.label}</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{s.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <QuickAction
            onClick={() => router.push('/admin/users')}
            label="Manage Users"
            description="View and manage user accounts"
            icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>}
          />
          <QuickAction
            onClick={() => router.push('/settings/members')}
            label="Invite Member"
            description="Send an invitation to join your org"
            icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" /></svg>}
          />
          <QuickAction
            onClick={() => router.push('/organization')}
            label="Organisation Settings"
            description="Configure branding, security & more"
            icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
          />
          <QuickAction
            onClick={() => router.push('/profile')}
            label="My Profile"
            description="Update your personal information"
            icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>}
          />
        </div>
      </div>
    </div>
  );
}

