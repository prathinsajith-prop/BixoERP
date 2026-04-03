'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import PageHeader from '@/components/page-header';
import CanDo from '@/components/can-do';

const AVATAR_COLORS = ['from-violet-500 to-purple-600', 'from-blue-500 to-cyan-500', 'from-emerald-500 to-teal-500', 'from-rose-500 to-pink-500', 'from-amber-500 to-orange-500', 'from-indigo-500 to-blue-600', 'from-fuchsia-500 to-purple-500', 'from-sky-500 to-blue-500'];

function avatarGradient(str: string) { let hash = 0; for (let i = 0; i < (str || '').length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash); return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]; }
function getInitials(name: string, email: string) { if (name) { const parts = name.trim().split(/\s+/); return parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : parts[0].substring(0, 2).toUpperCase(); } return (email || 'U').substring(0, 2).toUpperCase(); }
function formatDate(dateStr: string) { if (!dateStr) return '—'; const d = new Date(dateStr); if (isNaN(d.getTime())) return '—'; return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); }
function formatDateTime(dateStr: string) { if (!dateStr) return '—'; const d = new Date(dateStr); if (isNaN(d.getTime())) return '—'; return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
function timeAgo(dateStr: string) { if (!dateStr) return null; const d = new Date(dateStr); if (isNaN(d.getTime())) return null; const seconds = Math.floor((Date.now() - d.getTime()) / 1000); if (seconds < 60) return 'just now'; const minutes = Math.floor(seconds / 60); if (minutes < 60) return `${minutes}m ago`; const hours = Math.floor(minutes / 60); if (hours < 24) return `${hours}h ago`; const days = Math.floor(hours / 24); if (days < 30) return `${days}d ago`; const months = Math.floor(days / 30); if (months < 12) return `${months}mo ago`; return `${Math.floor(months / 12)}y ago`; }

function InfoRow({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between py-3">
      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className={`max-w-[60%] break-all text-right text-sm text-gray-900 dark:text-white ${mono ? 'font-mono text-xs' : ''}`}>{value || '—'}</dd>
    </div>
  );
}

interface Permission { id: string; resource?: string; action: string; code?: string; description?: string }
interface Role { id: string; name: string; description?: string; permissions?: Permission[] }
interface LoginHistoryEntry { ipAddress?: string | null; userAgent?: string | null; createdAt?: string; status?: string; failureReason?: string | null }

function formatPermChip(p: Permission): string {
  if (p.description) return p.description;
  const resourceSuffix = (p.resource ?? '').split(':').pop() ?? p.resource ?? '';
  const capitalize = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  if (resourceSuffix && p.action) return `${capitalize(resourceSuffix)}: ${capitalize(p.action)}`;
  if (p.action) return p.action.charAt(0).toUpperCase() + p.action.slice(1);
  return p.code ?? `${p.resource}:${p.action}`;
}

function parseBrowser(ua?: string | null): { browser: string; os: string; isMobile: boolean } {
  if (!ua) return { browser: 'Unknown Browser', os: 'Unknown OS', isMobile: false };
  const browsers: [RegExp, string][] = [
    [/Edg\//, 'Edge'], [/OPR\//, 'Opera'], [/Chrome\//, 'Chrome'],
    [/Firefox\//, 'Firefox'], [/Version\/.*Safari/, 'Safari'], [/curl\//, 'curl'],
  ];
  const osList: [RegExp, string][] = [
    [/Windows NT 10/, 'Windows 10'], [/Windows NT/, 'Windows'], [/Mac OS X/, 'macOS'],
    [/Android/, 'Android'], [/iPhone OS/, 'iOS'], [/iPad/, 'iPadOS'], [/Linux/, 'Linux'],
  ];
  return {
    browser: browsers.find(([re]) => re.test(ua))?.[1] ?? 'Browser',
    os: osList.find(([re]) => re.test(ua))?.[1] ?? 'Unknown OS',
    isMobile: /Android|iPhone|iPad|Mobile/.test(ua),
  };
}
function cleanIpAddr(ip?: string | null) { return ip ? ip.replace(/^::ffff:/, '') : 'Unknown IP'; }
function relTime(d?: string) {
  if (!d) return '';
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'just now'; if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`; return `${Math.floor(s / 86400)}d ago`;
}
interface UserData { id: string; email: string; firstName?: string; lastName?: string; isActive?: boolean; emailVerified?: boolean; emailVerifiedAt?: string; twoFactorEnabled?: boolean; twoFactorEnabledAt?: string; createdAt?: string; updatedAt?: string; lastLoginAt?: string; lastLoginIp?: string; lastLoginUserAgent?: string; loginCount?: number; failedLoginAttempts?: number; lockedUntil?: string; passwordChangedAt?: string; phone?: string; phoneNumber?: string; roles?: Role[]; organization?: { name?: string; plan?: string }; organizationId?: string; tenantId?: string; department?: string; jobTitle?: string; metadata?: Record<string, unknown>; socialAccounts?: { provider: string; linkedAt?: string }[]; security?: { loginHistory?: LoginHistoryEntry[]; loginHistoryTotal?: number; twoFactorEnabled?: boolean; emailVerified?: boolean; failedLoginAttempts?: number; lockedUntil?: string; socialAccounts?: { provider: string; email?: string; displayName?: string; linkedAt?: string }[] } }

export default function UserDetailsPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [editOpen, setEditOpen] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    setLoading(true); setError(null);
    try { const res = await authApi.getUser(userId); setUser(res.data?.data || res.data); } catch (err: any) { setError(err.response?.status === 404 ? 'User not found' : 'Failed to load user details'); } finally { setLoading(false); }
  }, [userId]);

  const fetchRoles = useCallback(async () => {
    try { const res = await authApi.listRoles(); setRoles(res.data?.data || res.data || []); } catch { setRoles([]); }
  }, []);

  useEffect(() => { fetchUser(); fetchRoles(); }, [fetchUser, fetchRoles]);

  const handleAssignRole = async (roleId: string) => {
    setAssigning(true);
    setAssignError(null);
    try { await authApi.assignRoleToUser(userId, roleId); await fetchUser(); setRoleModalOpen(false); } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed to assign role.';
      setAssignError(msg);
    } finally { setAssigning(false); }
  };

  const handleRemoveRole = async (roleId: string) => {
    try { await authApi.removeRoleFromUser(userId, roleId); await fetchUser(); } catch { }
  };

  const openEdit = () => {
    setEditFirstName(user?.firstName ?? '');
    setEditLastName(user?.lastName ?? '');
    setEditError(null);
    setEditOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setEditSaving(true);
    setEditError(null);
    try {
      await authApi.updateUser(userId, { firstName: editFirstName.trim(), lastName: editLastName.trim() });
      await fetchUser();
      setEditOpen(false);
    } catch (err: unknown) {
      setEditError((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed to save changes');
    } finally {
      setEditSaving(false);
    }
  };

  if (loading) return <div className="space-y-6"><div className="flex items-center justify-center py-32"><svg className="h-8 w-8 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div></div>;

  if (error || !user) return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center py-32">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/30"><svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg></div>
        <h2 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">{error || 'User not found'}</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">The user you&apos;re looking for doesn&apos;t exist or couldn&apos;t be loaded.</p>
        <button onClick={() => router.push('/admin/users')} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
          Back to Users
        </button>
      </div>
    </div>
  );

  const name = [user.firstName, user.lastName].filter(Boolean).join(' ');
  const displayName = name || user.email?.split('@')[0] || 'User';
  const userRoles = user.roles || [];
  const SECTIONS = [{ key: 'overview', label: 'Overview' }, { key: 'security', label: 'Security' }, { key: 'roles', label: 'Roles & Permissions' }, { key: 'activity', label: 'Activity' }];

  const cardClass = "rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800";
  const sectionIcon = "flex h-9 w-9 items-center justify-center rounded-xl";
  const badgeActive = "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
  const badgeInactive = "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300";

  return (
    <div className="space-y-6">
      <PageHeader title="User Details" subtitle="View and manage user account" />
      <button onClick={() => router.push('/admin/users')} className="mb-6 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
        Back to User Management
      </button>

      {/* Profile Header */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800">
        <div className="relative h-32 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600" />
        <div className="relative px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:gap-6">
            <div className="-mt-12 sm:-mt-14">
              <div className={`flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br ${avatarGradient(user.email)} text-2xl font-bold text-white shadow-lg ring-4 ring-white sm:h-28 sm:w-28 sm:text-3xl dark:ring-gray-900`}>{getInitials(name, user.email)}</div>
            </div>
            <div className="mt-4 flex-1 sm:mb-1 sm:mt-0">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{displayName}</h1>
                  <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${user.isActive !== false ? badgeActive : badgeInactive}`}>
                    <span className={`h-2 w-2 rounded-full ${user.isActive !== false ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    {user.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                  {user.emailVerified && <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-800">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.745 3.745 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>
                    Verified
                  </span>}
                  {/* Edit User — only visible to admins with auth:users:write permission */}
                  <CanDo resource="auth:users" action="write">
                    <button
                      onClick={openEdit}
                      className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                      </svg>
                      Edit User
                    </button>
                  </CanDo>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {[
              { icon: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z', val: String(userRoles.length), label: `Role${userRoles.length !== 1 ? 's' : ''}` },
              ...(user.twoFactorEnabled != null ? [{ icon: 'M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z', val: '2FA', label: user.twoFactorEnabled ? 'Enabled' : 'Disabled', labelClass: user.twoFactorEnabled ? 'text-emerald-600' : '' }] : []),
              ...(user.createdAt ? [{ icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5', val: formatDate(user.createdAt), label: 'Joined' }] : []),
              ...(user.lastLoginAt ? [{ icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z', val: timeAgo(user.lastLoginAt) || '', label: 'Last login' }] : []),
            ].map((pill, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={pill.icon} /></svg>
                {pill.label === 'Joined' || pill.label === 'Last login' ? <><span className="text-xs text-gray-500 dark:text-gray-400">{pill.label}</span><span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{pill.val}</span></> : <><span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{pill.val}</span><span className={`text-xs ${(pill as any).labelClass || 'text-gray-500 dark:text-gray-400'}`}>{pill.label}</span></>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section tabs */}
      <div className="mb-6 mt-6">
        <div className="inline-flex rounded-xl bg-gray-100/80 p-1 dark:bg-gray-800/80">
          {SECTIONS.map((s) => (
            <button key={s.key} onClick={() => setActiveSection(s.key)} className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${activeSection === s.key ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>{s.label}</button>
          ))}
        </div>
      </div>

      {/* Overview */}
      {activeSection === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className={cardClass}>
            <div className="mb-5 flex items-center gap-3"><div className={`${sectionIcon} bg-blue-100 dark:bg-blue-900/30`}><svg className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg></div><h2 className="text-base font-bold text-gray-900 dark:text-white">Personal Information</h2></div>
            <dl className="divide-y divide-gray-100 dark:divide-gray-800"><InfoRow label="First Name" value={user.firstName} /><InfoRow label="Last Name" value={user.lastName} /><InfoRow label="Email" value={user.email} /><InfoRow label="Phone" value={user.phone || user.phoneNumber} /><InfoRow label="User ID" value={user.id} mono /></dl>
          </div>
          <div className={cardClass}>
            <div className="mb-5 flex items-center gap-3"><div className={`${sectionIcon} bg-purple-100 dark:bg-purple-900/30`}><svg className="h-4.5 w-4.5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg></div><h2 className="text-base font-bold text-gray-900 dark:text-white">Account Information</h2></div>
            <dl className="divide-y divide-gray-100 dark:divide-gray-800">
              <div className="flex items-center justify-between py-3"><dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt><dd><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${user.isActive !== false ? badgeActive : badgeInactive}`}><span className={`h-1.5 w-1.5 rounded-full ${user.isActive !== false ? 'bg-emerald-500' : 'bg-red-500'}`} />{user.isActive !== false ? 'Active' : 'Inactive'}</span></dd></div>
              <div className="flex items-center justify-between py-3"><dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email Verified</dt><dd><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${user.emailVerified ? badgeActive : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'}`}>{user.emailVerified ? 'Verified' : 'Unverified'}</span></dd></div>
              <InfoRow label="Created" value={formatDateTime(user.createdAt || '')} />
              <InfoRow label="Last Updated" value={formatDateTime(user.updatedAt || '')} />
              <InfoRow label="Last Login" value={user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Never'} />
              {user.lastLoginIp && <InfoRow label="Last Login IP" value={user.lastLoginIp} mono />}
            </dl>
          </div>
          {(user.organization || user.organizationId || user.tenantId) && (
            <div className={cardClass}>
              <div className="mb-5 flex items-center gap-3"><div className={`${sectionIcon} bg-emerald-100 dark:bg-emerald-900/30`}><svg className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg></div><h2 className="text-base font-bold text-gray-900 dark:text-white">Organization</h2></div>
              <dl className="divide-y divide-gray-100 dark:divide-gray-800">
                {user.organization?.name && <InfoRow label="Organization" value={user.organization.name} />}
                {(user.organizationId || user.tenantId) && <InfoRow label="Organization ID" value={user.organizationId || user.tenantId} mono />}
                {user.organization?.plan && <InfoRow label="Plan" value={user.organization.plan} />}
                {user.department && <InfoRow label="Department" value={user.department} />}
                {user.jobTitle && <InfoRow label="Job Title" value={user.jobTitle} />}
              </dl>
            </div>
          )}
          {user.metadata && Object.keys(user.metadata).length > 0 && (
            <div className={cardClass}>
              <div className="mb-5 flex items-center gap-3"><div className={`${sectionIcon} bg-amber-100 dark:bg-amber-900/30`}><svg className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg></div><h2 className="text-base font-bold text-gray-900 dark:text-white">Custom Metadata</h2></div>
              <dl className="divide-y divide-gray-100 dark:divide-gray-800">{Object.entries(user.metadata).map(([key, value]) => <InfoRow key={key} label={key} value={String(value)} />)}</dl>
            </div>
          )}
        </div>
      )}

      {/* Security */}
      {activeSection === 'security' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className={cardClass}>
            <div className="mb-5 flex items-center gap-3"><div className={`${sectionIcon} bg-rose-100 dark:bg-rose-900/30`}><svg className="h-4.5 w-4.5 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg></div><h2 className="text-base font-bold text-gray-900 dark:text-white">Authentication</h2></div>
            <dl className="divide-y divide-gray-100 dark:divide-gray-800">
              <div className="flex items-center justify-between py-3"><dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Two-Factor Auth</dt><dd><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${user.twoFactorEnabled ? badgeActive : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>{user.twoFactorEnabled ? 'Enabled' : 'Disabled'}</span></dd></div>
              <div className="flex items-center justify-between py-3"><dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email Verified</dt><dd><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${user.emailVerified ? badgeActive : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'}`}>{user.emailVerified ? 'Yes' : 'No'}</span></dd></div>
              {user.passwordChangedAt && <InfoRow label="Password Changed" value={formatDateTime(user.passwordChangedAt)} />}
              {user.failedLoginAttempts != null && <div className="flex items-center justify-between py-3"><dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Failed Login Attempts</dt><dd><span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${user.failedLoginAttempts > 0 ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>{user.failedLoginAttempts}</span></dd></div>}
              {user.lockedUntil && <InfoRow label="Locked Until" value={formatDateTime(user.lockedUntil)} />}
            </dl>
          </div>
          <div className={`${cardClass} lg:col-span-2`}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3"><div className={`${sectionIcon} bg-sky-100 dark:bg-sky-900/30`}><svg className="h-4.5 w-4.5 text-sky-600 dark:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div><div><h2 className="text-base font-bold text-gray-900 dark:text-white">Login History</h2><p className="text-xs text-gray-500 dark:text-gray-400">{user.security?.loginHistoryTotal ?? 0} authentication event{(user.security?.loginHistoryTotal ?? 0) !== 1 ? 's' : ''} recorded</p></div></div>
              <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-2.5 py-1.5 dark:bg-gray-800"><svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg><span className="text-xs font-medium text-gray-500 dark:text-gray-400">Security Log</span></div>
            </div>
            {!user.security?.loginHistory?.length ? (
              <div className="flex flex-col items-center justify-center py-12 text-center"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800"><svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div><p className="mt-3 text-sm font-medium text-gray-600 dark:text-gray-300">No login events recorded yet</p></div>
            ) : (
              <div className="max-h-96 divide-y divide-gray-50 overflow-y-auto rounded-xl ring-1 ring-gray-100 dark:divide-gray-800/60 dark:ring-gray-800">
                {user.security.loginHistory.map((entry, i) => {
                  const { browser, os, isMobile } = parseBrowser(entry.userAgent);
                  const isSuccess = (entry.status ?? 'SUCCESS') === 'SUCCESS';
                  const dt = entry.createdAt ? new Date(entry.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;
                  return (
                    <div key={i} className={`flex items-start gap-4 px-4 py-3.5 transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-800/30 ${!isSuccess ? 'bg-red-50/40 dark:bg-red-900/5' : ''}`}>
                      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isSuccess ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {isMobile ? <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3" /></svg> : <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" /></svg>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2"><span className="text-sm font-semibold text-gray-900 dark:text-white">{browser}</span><span className="text-gray-300">·</span><span className="text-sm text-gray-500 dark:text-gray-400">{os}</span></div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>{cleanIpAddr(entry.ipAddress)}</span>
                          {dt && <><span className="text-gray-300">·</span><span>{dt}</span><span className="text-gray-300">·</span><span>{relTime(entry.createdAt)}</span></>}
                        </div>
                        {!isSuccess && entry.failureReason && <div className="mt-1 rounded-md bg-red-50 px-2 py-0.5 dark:bg-red-900/20"><span className="text-xs text-red-600 dark:text-red-400">{entry.failureReason}</span></div>}
                      </div>
                      <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${isSuccess ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}><span className={`h-1.5 w-1.5 rounded-full ${isSuccess ? 'bg-emerald-500' : 'bg-red-500'}`} />{isSuccess ? 'Success' : 'Failed'}</span>
                    </div>
                  );
                })}
              </div>
            )}
            {(user.security?.socialAccounts?.length ?? 0) > 0 && (
              <div className="mt-5 border-t border-gray-100 pt-5 dark:border-gray-800">
                <h3 className="mb-3 text-sm font-bold text-gray-900 dark:text-white">Linked Accounts</h3>
                <div className="space-y-2">{user.security!.socialAccounts!.map((account) => (<div key={account.provider} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2.5 ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700"><span className="text-sm font-semibold capitalize text-gray-700 dark:text-gray-200">{account.provider}</span><span className="text-xs text-gray-500 dark:text-gray-400">{account.linkedAt ? formatDate(account.linkedAt) : 'Linked'}</span></div>))}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Roles & Permissions */}
      {activeSection === 'roles' && (
        <div className="space-y-6">
          <div className={cardClass}>
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3"><div className={`${sectionIcon} bg-indigo-100 dark:bg-indigo-900/30`}><svg className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg></div><div><h2 className="text-base font-bold text-gray-900 dark:text-white">Assigned Roles</h2><p className="text-xs text-gray-500 dark:text-gray-400">{userRoles.length} role{userRoles.length !== 1 ? 's' : ''} assigned</p></div></div>
              <button onClick={() => setRoleModalOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>Assign Role</button>
            </div>
            {userRoles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center"><svg className="h-10 w-10 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg><p className="mt-3 text-sm font-medium text-gray-500 dark:text-gray-400">No roles assigned</p></div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {userRoles.map((role) => {
                  const rolePerms = role.permissions || [];
                  return (
                    <div key={role.id || role.name} className="group relative rounded-xl border border-gray-100 bg-gray-50/50 p-4 transition hover:border-gray-200 hover:bg-white dark:border-gray-800 dark:bg-gray-800/50 dark:hover:border-gray-700 dark:hover:bg-gray-800">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30"><svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg></div>
                          <div><h3 className="text-sm font-bold text-gray-900 dark:text-white">{role.name}</h3>{role.description && <p className="mt-0.5 line-clamp-1 text-xs text-gray-500 dark:text-gray-400">{role.description}</p>}</div>
                        </div>
                        <button onClick={() => handleRemoveRole(role.id)} className="rounded-lg p-1.5 text-gray-400 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-900/20" title="Remove role"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                      </div>
                      {rolePerms.length > 0 && <div className="mt-3 flex flex-wrap gap-1">{rolePerms.slice(0, 5).map((p) => <span key={p.id} title={p.code ?? `${p.resource}:${p.action}`} className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-gray-600 ring-1 ring-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:ring-gray-700">{formatPermChip(p)}</span>)}{rolePerms.length > 5 && <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-400">+{rolePerms.length - 5} more</span>}</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {userRoles.length > 0 && (() => {
            const allPerms: (Permission & { fromRole: string })[] = [];
            const seen = new Set<string>();
            userRoles.forEach((role) => (role.permissions || []).forEach((p) => { const key = `${p.resource}:${p.action}`; if (!seen.has(key)) { seen.add(key); allPerms.push({ ...p, fromRole: role.name }); } }));
            const grouped: Record<string, typeof allPerms> = {};
            allPerms.forEach((p) => { const r = p.resource || 'general'; if (!grouped[r]) grouped[r] = []; grouped[r].push(p); });
            if (allPerms.length === 0) return null;
            return (
              <div className={cardClass}>
                <div className="mb-5 flex items-center gap-3"><div className={`${sectionIcon} bg-teal-100 dark:bg-teal-900/30`}><svg className="h-4.5 w-4.5 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg></div><div><h2 className="text-base font-bold text-gray-900 dark:text-white">Effective Permissions</h2><p className="text-xs text-gray-500 dark:text-gray-400">{allPerms.length} unique permission{allPerms.length !== 1 ? 's' : ''} across all roles</p></div></div>
                <div className="space-y-4">
                  {Object.entries(grouped).map(([resource, perms]) => (
                    <div key={resource}>
                      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">{resource}</h3>
                      <div className="flex flex-wrap gap-2">{perms.map((p) => <span key={`${p.resource}:${p.action}`} className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 ring-1 ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700" title={`From role: ${p.fromRole}`}><svg className="h-3 w-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>{p.action}<span className="text-[10px] text-gray-400">via {p.fromRole}</span></span>)}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Activity */}
      {activeSection === 'activity' && (
        <div className={`${cardClass} lg:col-span-2`}>
          <div className="mb-5 flex items-center gap-3"><div className={`${sectionIcon} bg-orange-100 dark:bg-orange-900/30`}><svg className="h-4.5 w-4.5 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div><h2 className="text-base font-bold text-gray-900 dark:text-white">Account Timeline</h2></div>
          <div className="relative ml-4 space-y-6 border-l-2 border-gray-100 pl-6 dark:border-gray-800">
            {[
              ...(user.createdAt ? [{ color: 'bg-blue-500', icon: 'M12 4.5v15m7.5-7.5h-15', title: 'Account Created', date: user.createdAt }] : []),
              ...(user.emailVerified && user.emailVerifiedAt ? [{ color: 'bg-emerald-500', icon: 'M4.5 12.75l6 6 9-13.5', title: 'Email Verified', date: user.emailVerifiedAt }] : []),
              ...(user.twoFactorEnabled && user.twoFactorEnabledAt ? [{ color: 'bg-purple-500', icon: 'M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75', title: '2FA Enabled', date: user.twoFactorEnabledAt }] : []),
              ...(user.passwordChangedAt ? [{ color: 'bg-amber-500', icon: 'M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912', title: 'Password Changed', date: user.passwordChangedAt }] : []),
              ...(user.lastLoginAt ? [{ color: 'bg-sky-500', icon: 'M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15', title: 'Last Login', date: user.lastLoginAt, extra: user.lastLoginIp }] : []),
              ...(user.updatedAt && user.updatedAt !== user.createdAt ? [{ color: 'bg-gray-400', icon: 'M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z', title: 'Profile Updated', date: user.updatedAt }] : []),
            ].map((event, i) => (
              <div key={i} className="relative">
                <div className={`absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full ${event.color} ring-4 ring-white dark:ring-gray-900`}><svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d={event.icon} /></svg></div>
                <div><p className="text-sm font-semibold text-gray-900 dark:text-white">{event.title}</p><p className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(event.date)}</p>{(event as any).extra && <p className="mt-0.5 font-mono text-xs text-gray-400">IP: {(event as any).extra}</p>}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assign Role Modal */}
      {roleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-gray-200/60 dark:bg-gray-900 dark:ring-gray-700">
            <button onClick={() => { setRoleModalOpen(false); setAssignError(null); }} className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Assign Role</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Select a role to assign to <span className="font-semibold text-gray-700 dark:text-gray-200">{displayName}</span></p>
            {assignError && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">{assignError}</div>}
            {userRoles.length > 0 && <div className="mb-4 mt-4"><p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Current Roles</p><div className="flex flex-wrap gap-2">{userRoles.map((role) => <span key={role.id || role.name} className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">{role.name}</span>)}</div></div>}
            <div className="mt-4"><p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Available Roles</p>
              <div className="max-h-48 space-y-1.5 overflow-y-auto">
                {roles.filter((r) => !userRoles.some((ur) => ur.id === r.id)).map((role) => (
                  <button key={role.id} onClick={() => handleAssignRole(role.id)} disabled={assigning} className="flex w-full items-center justify-between rounded-xl border border-gray-100 px-4 py-3 text-left transition hover:border-gray-200 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-800 dark:hover:border-gray-700 dark:hover:bg-gray-800">
                    <div><p className="text-sm font-semibold text-gray-900 dark:text-white">{role.name}</p>{role.description && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{role.description}</p>}</div>
                    <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  </button>
                ))}
                {roles.filter((r) => !userRoles.some((ur) => ur.id === r.id)).length === 0 && <p className="py-4 text-center text-xs text-gray-400">All roles assigned</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit User</h2>
              <button onClick={() => setEditOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {editError && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">{editError}</div>
            )}
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">First Name</label>
                <input
                  type="text"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
                <input
                  type="text"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
                  Cancel
                </button>
                <button type="submit" disabled={editSaving} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60">
                  {editSaving && (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  )}
                  {editSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
