'use client';

import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '../store/auth';
import { authApi } from '../lib/api/auth';
import { filesApi } from '../lib/api/files';
import { APP_NAME } from '../lib/config';
import { useModuleMenu } from '../hooks/use-module-menu';
import { getIcon } from './icons';


const ORG_GRADIENTS = [
  'from-violet-500 to-purple-600', 'from-blue-500 to-cyan-500', 'from-emerald-500 to-teal-500',
  'from-rose-500 to-pink-500', 'from-amber-500 to-orange-500', 'from-indigo-500 to-blue-600',
];
function orgGradient(idx: number) { return ORG_GRADIENTS[idx % ORG_GRADIENTS.length]; }

/* ─── Helpers ─── */
function decodeToken(token: string) {
  try { return JSON.parse(atob(token.split('.')[1])); } catch { return null; }
}

function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    const listener = (e: MouseEvent) => {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      handler();
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler]);
}

/* ─── Org type ─── */
interface OrgRaw { organizationId?: string; id?: string; name: string; slug?: string; role?: string; }
interface Org { id: string; name: string; slug?: string; role?: string; }
function normalizeOrg(o: OrgRaw): Org {
  return { id: o.organizationId || o.id || '', name: o.name, slug: o.slug, role: o.role };
}

/* ─── Small icon-only sidebar item ─── */
function SidebarIcon({ icon, label, onClick, active, badge }: {
  icon: ReactNode; label: string; onClick: () => void; active?: boolean; badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all
        ${active
          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white'
        }`}
    >
      {icon}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
}

/* ─── Flyout panel (right of icon rail on desktop, bottom sheet on mobile) ─── */
function Flyout({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, onClose);

  if (!open) return null;
  return (
    <>
      {/* Mobile backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] md:hidden" onClick={onClose} />
      <div ref={ref} className="fixed bottom-16 left-3 right-3 z-50 w-auto rounded-2xl bg-white shadow-xl ring-1 ring-gray-200/60 dark:bg-gray-800 dark:ring-gray-700 md:absolute md:bottom-auto md:left-full md:right-auto md:top-0 md:ml-2 md:w-72"
        style={{ maxHeight: 'calc(100vh - 80px)' }}>
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="overflow-y-auto py-2" style={{ maxHeight: 'calc(100vh - 144px)' }}>
          {children}
        </div>
      </div>
    </>
  );
}

/* ─── Admin section link ─── */
function AdminLink({ icon, label, path, active }: { icon: ReactNode; label: string; path: string; active?: boolean }) {
  return (
    <a href={path}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition
        ${active ? 'bg-blue-50 font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
          : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5'}`}>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">{icon}</span>
      {label}
    </a>
  );
}

/* ─── Org Switcher (inline sidebar version) ─── */
function SidebarOrgSwitcher({ onToggle, active }: { onToggle: () => void; active: boolean }) {
  const [currentOrg, setCurrentOrg] = useState<Org | null>(null);

  useEffect(() => {
    authApi.myOrganizations().then((res: { data?: { data?: OrgRaw[] } }) => {
      const list = (res.data?.data || []).map(normalizeOrg);
      const storedId = typeof window !== 'undefined' ? localStorage.getItem('organizationId') : null;
      setCurrentOrg(list.find((o) => o.id === storedId) || list[0] || null);
    }).catch(() => { });
  }, []);

  const initial = currentOrg?.name?.charAt(0)?.toUpperCase() || 'O';
  const idx = currentOrg ? 0 : 0;

  return (
    <button
      onClick={onToggle}
      title={currentOrg?.name || 'Switch Organization'}
      className={`group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all
        ${active
          ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-gray-900'
          : 'ring-1 ring-gray-200 hover:ring-gray-300 dark:ring-gray-700 dark:hover:ring-gray-600'
        }`}
    >
      <div className={`flex h-full w-full items-center justify-center rounded-xl bg-gradient-to-br ${orgGradient(idx)} text-xs font-bold text-white`}>
        {initial}
      </div>
    </button>
  );
}

/* ─── Org Switcher ─── */
function OrgSwitcher() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Org | null>(null);
  const [switching, setSwitching] = useState<string | null>(null);

  useEffect(() => {
    authApi.myOrganizations().then((res: { data?: { data?: OrgRaw[] } }) => {
      const list = (res.data?.data || []).map(normalizeOrg);
      setOrgs(list);
      const storedId = typeof window !== 'undefined' ? localStorage.getItem('organizationId') : null;
      setCurrentOrg(list.find((o) => o.id === storedId) || list[0] || null);
    }).catch(() => { });
  }, []);

  const handleSwitch = async (org: Org) => {
    if (!org.id || org.id === currentOrg?.id) return;
    setSwitching(org.id);
    try {
      const res = await authApi.switchOrganization({ organizationId: org.id });
      const data = (res as { data?: { data?: { accessToken?: string; tenantId?: string } } }).data?.data;
      if (data?.accessToken) {
        // Access token stored in memory only — cookie is set server-side automatically
        useAuthStore.setState({ accessToken: data.accessToken, fullAccessToken: data.accessToken, isAuthenticated: true });
        if (data.tenantId) sessionStorage.setItem('tenantId', data.tenantId);
      }
      localStorage.setItem('organizationId', org.id);
      window.location.reload();
    } catch {
      localStorage.setItem('organizationId', org.id);
      window.location.reload();
    }
  };

  const roleColors: Record<string, string> = { Owner: 'bg-violet-100 text-violet-700', Admin: 'bg-blue-100 text-blue-700', Member: 'bg-gray-100 text-gray-600' };

  if (orgs.length <= 1) return null;

  return (
    <div className="px-2">
      <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Switch Org</p>
      {orgs.map((org, idx) => {
        const isActive = org.id === currentOrg?.id;
        const isSwitching = switching === org.id;
        return (
          <button key={org.id || idx} onClick={() => handleSwitch(org)} disabled={isSwitching}
            className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition ${isActive ? 'bg-blue-50/60 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-white/5'} ${isSwitching ? 'opacity-60' : ''}`}>
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${orgGradient(idx)} text-[11px] font-bold text-white`}>
              {org.name?.charAt(0)?.toUpperCase() || 'O'}
            </div>
            <div className="min-w-0 flex-1">
              <p className={`truncate text-sm font-medium ${isActive ? 'text-blue-900 dark:text-blue-200' : 'text-gray-700 dark:text-gray-300'}`}>{org.name}</p>
            </div>
            {org.role && <span className={`shrink-0 rounded-full px-1.5 py-px text-[9px] font-bold uppercase tracking-wide ${roleColors[org.role] || roleColors.Member}`}>{org.role}</span>}
            {isActive && <svg className="h-3.5 w-3.5 shrink-0 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
            {isSwitching && <svg className="h-3.5 w-3.5 shrink-0 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Main Sidebar Component
   ═══════════════════════════════════════════════════ */
export function ModuleSidebar({ moduleId }: { moduleId?: string }) {
  const { logout, accessToken } = useAuthStore();
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const pathname = usePathname();

  /* Resolve current module nav items from URL */
  const { items: menuItems } = useModuleMenu(moduleId);
  const hasModuleMenu = menuItems.length > 0;

  /* user info */
  const user = accessToken ? decodeToken(accessToken) : null;
  const fallbackName = user?.email?.split('@')[0] ?? 'User';
  const [displayName, setDisplayName] = useState(fallbackName);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [orgName, setOrgName] = useState('');

  useEffect(() => {
    authApi.getProfile()
      .then(({ data }: { data: { data?: { user?: { firstName?: string; lastName?: string; email?: string }; personal?: { avatarUrl?: string } } } }) => {
        const u = data.data?.user;
        if (u) {
          const full = [u.firstName, u.lastName].filter(Boolean).join(' ');
          if (full) setDisplayName(full);
        }
        const avatarPath = data.data?.personal?.avatarUrl;
        if (avatarPath) {
          const match = avatarPath.match(/\/api\/v1\/files\/([^/]+)\/download/);
          if (match) filesApi.download(match[1]).then((blobUrl) => setAvatarUrl(blobUrl)).catch(() => { });
        }
      }).catch(() => { });
  }, []);

  useEffect(() => {
    authApi.myOrganizations()
      .then((res: { data?: { data?: OrgRaw[] } }) => {
        const list = (res.data?.data || []).map(normalizeOrg);
        const storedId = localStorage.getItem('organizationId');
        const current = list.find((o) => o.id === storedId) || list[0];
        if (current?.name) setOrgName(current.name);
      }).catch(() => { });
  }, []);

  useEffect(() => {
    const onAvatarUpdated = (e: CustomEvent<{ blobUrl: string }>) => setAvatarUrl(e.detail.blobUrl);
    window.addEventListener('avatar-updated', onAvatarUpdated as EventListener);
    return () => window.removeEventListener('avatar-updated', onAvatarUpdated as EventListener);
  }, []);

  const toggle = (panel: string) => setActivePanel((p) => (p === panel ? null : panel));
  const closePanel = () => setActivePanel(null);
  const goTo = (path: string) => { closePanel(); window.location.href = path; };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const initial = displayName.charAt(0).toUpperCase();

  return (
    <aside className="fixed bottom-0 left-0 right-0 z-40 flex md:bottom-3 md:left-3 md:right-auto md:top-3">
      {/* Icon rail */}
      <div className="flex h-14 w-full flex-row items-center justify-around bg-white/95 ring-1 ring-gray-200/60 backdrop-blur-xl dark:bg-gray-900/95 dark:ring-gray-700/60 dark:shadow-none md:h-auto md:w-[56px] md:flex-col md:justify-start md:rounded-2xl md:py-3 md:shadow-lg md:shadow-gray-900/5">

        {/* Logo */}
        <a href="/" className="mb-4 hidden h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md shadow-blue-500/25 ring-1 ring-white/20 md:flex" title={APP_NAME}>
          <span className="text-sm font-extrabold tracking-wide text-white">B</span>
        </a>

        <div className="my-1.5 hidden h-px w-6 bg-gray-200 md:block dark:bg-gray-700" />

        {/* ─── Module Nav or Default Admin Icons ─── */}
        {hasModuleMenu ? (
          /* Module-specific nav items loaded from /{moduleId}/api/menu */
          <div className="contents md:flex md:flex-col md:items-center md:gap-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href || pathname === item.href.replace(`/${moduleId}`, '') || pathname === '/';
              return (
                <SidebarIcon
                  key={item.href}
                  icon={getIcon(item.icon, 'h-5 w-5')}
                  label={item.label}
                  onClick={() => goTo(item.href)}
                  active={isActive}
                />
              );
            })}
          </div>
        ) : (
          /* Default portal admin icons */
          <>
            {/* Admin - Users */}
            <SidebarIcon
              icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>}
              label="Users & Roles"
              onClick={() => toggle('users')}
              active={activePanel === 'users'}
            />

            {/* Admin - Organization */}
            <SidebarIcon
              icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>}
              label="Organization"
              onClick={() => toggle('org')}
              active={activePanel === 'org'}
            />
          </>
        )}

        {/* Spacer */}
        <div className="hidden md:block md:flex-1" />

        {/* Settings */}
        <div className={hasModuleMenu ? 'hidden md:block' : ''}>
          <SidebarIcon
            icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
            label="Settings"
            onClick={() => goTo('/settings')}
          />
        </div>

        {/* Profile avatar */}
        <button onClick={() => toggle('profile')} title="Profile" className={`md:mt-2 md:mb-1 ${hasModuleMenu ? 'hidden md:block' : ''}`}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className={`h-9 w-9 rounded-full object-cover ring-2 transition ${activePanel === 'profile' ? 'ring-blue-500' : 'ring-transparent hover:ring-gray-300 dark:hover:ring-gray-600'}`} />
          ) : (
            <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition
              ${activePanel === 'profile'
                ? 'bg-blue-600 text-white ring-2 ring-blue-500'
                : 'bg-blue-100 text-blue-700 ring-2 ring-transparent hover:ring-gray-300 dark:bg-blue-900/30 dark:text-blue-300'}`}>
              {initial}
            </div>
          )}
        </button>
      </div>

      {/* ─── Flyout Panels ─── */}
      <div className="contents md:relative md:h-full">
        {/* Users & Roles */}
        {!hasModuleMenu && (
          <Flyout open={activePanel === 'users'} onClose={closePanel} title="Users & Access">
            <div className="space-y-0.5 px-2">
              <AdminLink label="User Management" path="/admin/users"
                icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>} />
              <AdminLink label="Roles" path="/admin/roles"
                icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>} />
              <AdminLink label="Permissions" path="/admin/permissions"
                icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>} />
            </div>
          </Flyout>
        )}

        {/* Organization */}
        {!hasModuleMenu && (
          <Flyout open={activePanel === 'org'} onClose={closePanel} title="Organization">
            <div className="space-y-0.5 px-2">
              <AdminLink label="Divisions" path="/admin/divisions"
                icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>} />
              <AdminLink label="Departments" path="/admin/departments"
                icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" /></svg>} />
              <AdminLink label="Teams" path="/admin/teams"
                icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>} />
            </div>
          </Flyout>
        )}

        {/* Profile */}
        <Flyout open={activePanel === 'profile'} onClose={closePanel} title="Account">
          <div className="px-4 pb-3">
            <div className="flex items-center gap-3">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="h-11 w-11 rounded-full object-cover" />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-bold text-white">{initial}</div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 truncate dark:text-white">{displayName}</p>
                <p className="text-xs text-gray-500 truncate dark:text-gray-400">{user?.email ?? ''}</p>
                {orgName && <span className="mt-0.5 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">{orgName}</span>}
              </div>
            </div>
          </div>
          <div className="border-t border-gray-100 dark:border-gray-700" />
          <div className="space-y-0.5 px-2 pt-2">
            <AdminLink label="My Profile" path="/profile"
              icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>} />
            <AdminLink label="Change Password" path="/change-password"
              icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>} />
            <AdminLink label="Settings" path="/settings"
              icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
            <AdminLink label="Two-Factor Auth" path="/2fa/setup"
              icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a48.667 48.667 0 00-1.429 8.272M5.742 6.364c.12-.107.244-.21.37-.31m10.246 2.457a1.5 1.5 0 00-2.835.695l.244 2.114a5.995 5.995 0 01-1.708 5.05l-.052.052a6.007 6.007 0 01-5.05 1.707l-.127-.014" /></svg>} />
          </div>
          <div className="mx-2 my-2 border-t border-gray-100 dark:border-gray-700" />
          <div className="px-2 pb-1">
            <button onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
              </span>
              Sign out
            </button>
          </div>
        </Flyout>
      </div>
    </aside>
  );
}
