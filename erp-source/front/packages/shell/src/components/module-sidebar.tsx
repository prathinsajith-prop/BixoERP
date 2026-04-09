'use client';

import React, { useState, useEffect, useRef, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
interface OrgRaw { organizationId?: string; id?: string; name: string; slug?: string; role?: string; logoUrl?: string; }
interface Org { id: string; name: string; slug?: string; role?: string; logoUrl?: string; }
function normalizeOrg(o: OrgRaw): Org {
  return { id: o.organizationId || o.id || '', name: o.name, slug: o.slug, role: o.role, logoUrl: o.logoUrl };
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
          ? 'text-white shadow-md'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white'
        }`}
      style={active ? { backgroundColor: 'var(--gogo-primary)', boxShadow: '0 4px 12px rgba(146,44,136,0.30)' } : undefined}
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
function Flyout({ open, onClose, title, children, anchorRef }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode;
  anchorRef?: React.RefObject<HTMLElement | null>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, onClose);

  // Position the panel relative to its trigger button, opening upward when
  // the trigger is near the bottom of the sidebar so the panel stays visible.
  const [panelPos, setPanelPos] = useState<{ top?: string; bottom?: string }>({ top: '0px' });
  useEffect(() => {
    if (!open) return;
    const headerHeight = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--gogo-header-height') || '64', 10
    );
    if (!anchorRef?.current) {
      setPanelPos({ top: '0px' });
      return;
    }
    const btn = anchorRef.current.getBoundingClientRect();
    const sidebarHeight = window.innerHeight - headerHeight;
    const btnTopRelative = btn.top - headerHeight; // distance from sidebar top

    // If button is in the lower 55 % of the sidebar, open the panel upward
    if (btnTopRelative > sidebarHeight * 0.55) {
      const bottomOffset = sidebarHeight - btnTopRelative - btn.height;
      setPanelPos({ bottom: `${Math.max(0, bottomOffset)}px` });
    } else {
      setPanelPos({ top: `${Math.max(0, btnTopRelative)}px` });
    }
  }, [open, anchorRef]);

  if (!open) return null;
  return (
    <>
      {/* Mobile backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] md:hidden" onClick={onClose} />
      <div ref={ref} className="fixed bottom-16 left-3 right-3 z-50 w-auto rounded-2xl bg-white shadow-xl ring-1 ring-gray-200/60 dark:bg-gray-800 dark:ring-gray-700 md:absolute md:bottom-auto md:left-full md:right-auto md:ml-2 md:w-72"
        style={{
          maxHeight: 'calc(100vh - var(--gogo-header-height) - 2rem)',
          ...panelPos,
        }}>
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
    <Link href={path}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition
        ${active ? 'font-medium dark:text-purple-300'
          : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5'}`}
      style={active ? { backgroundColor: 'color-mix(in srgb, var(--gogo-primary) 8%, transparent)', color: 'var(--gogo-primary)' } : undefined}>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">{icon}</span>
      {label}
    </Link>
  );
}

/* ─── Org Switcher (inline sidebar version) ─── */
const SidebarOrgSwitcher = React.forwardRef<HTMLButtonElement, {
  onToggle: () => void; active: boolean; currentOrg: Org | null; gradientIdx: number; logoBlobUrl?: string | null;
}>(function SidebarOrgSwitcher({ onToggle, active, currentOrg, gradientIdx, logoBlobUrl }, ref) {
  const initial = currentOrg?.name?.charAt(0)?.toUpperCase() || 'O';

  return (
    <button
      ref={ref}
      onClick={onToggle}
      title={currentOrg?.name || 'Switch Organization'}
      className={`group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all
        ${active
          ? 'ring-2 ring-offset-1 dark:ring-offset-gray-900'
          : 'ring-1 ring-gray-200 hover:ring-gray-300 dark:ring-gray-700 dark:hover:ring-gray-600'
        }`}
      style={active ? { '--tw-ring-color': 'var(--gogo-primary)' } as React.CSSProperties : undefined}
    >
      {logoBlobUrl ? (
        <img src={logoBlobUrl} alt={currentOrg?.name} className="h-full w-full rounded-xl object-cover" />
      ) : (
        <div className={`flex h-full w-full items-center justify-center rounded-xl bg-gradient-to-br ${orgGradient(gradientIdx)} text-xs font-bold text-white`}>
          {initial}
        </div>
      )}
    </button>
  );
});



/* ═══════════════════════════════════════════════════
   Main Sidebar Component
   ═══════════════════════════════════════════════════ */
export function ModuleSidebar({ moduleId }: { moduleId?: string }) {
  const { logout, accessToken } = useAuthStore();
  const router = useRouter();
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
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [orgLogoBlobUrls, setOrgLogoBlobUrls] = useState<Record<string, string>>({});
  const [switching, setSwitching] = useState<string | null>(null);

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
        setOrgs(list);
        const storedId = localStorage.getItem('organizationId');
        const current = list.find((o) => o.id === storedId) || list[0];
        if (current) {
          setCurrentOrgId(current.id);
          if (current.name) setOrgName(current.name);
        }
      }).catch(() => { });
  }, []);

  useEffect(() => {
    orgs.forEach((org) => {
      if (!org.logoUrl) return;
      const match = org.logoUrl.match(/\/files\/([0-9a-f-]+)\/download/);
      if (!match) return;
      filesApi.download(match[1], org.id)
        .then((url: string | null) => { if (url) setOrgLogoBlobUrls((prev) => ({ ...prev, [org.id]: url })); })
        .catch(() => { });
    });
  }, [orgs]);

  const handleOrgSwitch = async (org: Org) => {
    if (!org.id || org.id === currentOrgId) return;
    setSwitching(org.id);
    try {
      const res = await authApi.switchOrganization({ organizationId: org.id });
      const data = (res as { data?: { data?: { accessToken?: string; tenantId?: string } } }).data?.data;
      if (data?.accessToken) {
        useAuthStore.setState({ accessToken: data.accessToken, fullAccessToken: data.accessToken, isAuthenticated: true });
      }
      if (data?.tenantId) sessionStorage.setItem('tenantId', data.tenantId);
      localStorage.setItem('organizationId', org.id);
      window.location.replace('/');
    } catch {
      setSwitching(null);
    }
  };

  useEffect(() => {
    const onAvatarUpdated = (e: CustomEvent<{ blobUrl: string }>) => setAvatarUrl(e.detail.blobUrl);
    window.addEventListener('avatar-updated', onAvatarUpdated as EventListener);
    return () => window.removeEventListener('avatar-updated', onAvatarUpdated as EventListener);
  }, []);

  const toggle = (panel: string) => setActivePanel((p) => (p === panel ? null : panel));
  const closePanel = () => setActivePanel(null);
  const goTo = (path: string) => { closePanel(); router.push(path); };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const initial = displayName.charAt(0).toUpperCase();

  // Ref for the org-switcher button so the flyout can anchor to it
  const orgSwitcherRef = useRef<HTMLButtonElement>(null);

  return (
    <aside className="fixed bottom-0 left-0 right-0 z-40 flex md:bottom-0 md:left-0 md:right-auto md:top-[var(--gogo-header-height)]">
      {/* Icon rail */}
      <div className="gogo-sidebar flex h-14 w-full flex-row items-center justify-around bg-white ring-1 ring-gray-200/60 backdrop-blur-xl dark:bg-gray-900 dark:ring-gray-700/60 md:h-[calc(100vh-var(--gogo-header-height))] md:w-[var(--gogo-sidebar-width)] md:flex-col md:justify-start md:border-r md:border-[var(--gogo-divider)] md:py-3 md:ring-0 md:shadow-none md:dark:border-gray-700/60">

        <div className="my-1 hidden h-px w-6 bg-gray-200 md:block dark:bg-gray-700" />

        {/* ─── Module Nav or Default Admin Icons ─── */}
        {hasModuleMenu ? (
          /* Module-specific nav items loaded from /{moduleId}/api/menu */
          <div className="contents md:flex md:flex-col md:items-center md:gap-1">
            {menuItems.filter((item) => item.label?.toLowerCase() !== 'settings' && !item.href?.endsWith('/settings')).map((item) => {
              const itemHasChildren = (item.children?.length ?? 0) > 0;
              // Active when the flyout panel is open (children) OR when the
              // current pathname exactly matches or is a sub-path of this item.
              // Never use a blanket fallback like `pathname === '/'` which would
              // highlight every item on the root page.
              const isActive = itemHasChildren
                ? activePanel === item.href
                : pathname === item.href ||
                (item.href.length > 1 && pathname.startsWith(item.href + '/'));
              return (
                <SidebarIcon
                  key={item.href}
                  icon={getIcon(item.icon, 'h-5 w-5')}
                  label={item.label}
                  onClick={() => itemHasChildren ? toggle(item.href) : goTo(item.href)}
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

        {/* Org Switcher — above settings */}
        <div className="mb-1">
          <SidebarOrgSwitcher
            ref={orgSwitcherRef}
            onToggle={() => toggle('orgs')}
            active={activePanel === 'orgs'}
            currentOrg={orgs.find((o) => o.id === currentOrgId) ?? null}
            gradientIdx={orgs.findIndex((o) => o.id === currentOrgId)}
            logoBlobUrl={currentOrgId ? (orgLogoBlobUrls[currentOrgId] ?? null) : null}
          />
        </div>

        {/* Settings */}
        <div className="">
          <SidebarIcon
            icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
            label="Settings"
            onClick={() => goTo('/settings')}
          />
        </div>

        {/* Profile avatar */}
        <button onClick={() => toggle('profile')} title="Profile" className="md:mt-2 md:mb-1">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className={`h-9 w-9 rounded-full object-cover ring-2 transition ${activePanel === 'profile' ? '' : 'ring-transparent hover:ring-gray-300 dark:hover:ring-gray-600'}`}
              style={activePanel === 'profile' ? { '--tw-ring-color': 'var(--gogo-primary)' } as React.CSSProperties : undefined} />
          ) : (
            <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ring-2 transition
              ${activePanel === 'profile' ? 'text-white' : 'ring-transparent hover:ring-gray-300 dark:hover:ring-gray-600'}`}
              style={activePanel === 'profile'
                ? { backgroundColor: 'var(--gogo-primary)', '--tw-ring-color': 'var(--gogo-primary)' } as React.CSSProperties
                : { backgroundColor: 'color-mix(in srgb, var(--gogo-primary) 12%, #fff)', color: 'var(--gogo-primary-dark)' }}>
              {initial}
            </div>
          )}
        </button>
      </div>

      {/* ─── Flyout Panels ─── */}
      <div className="contents md:relative md:h-full">
        {/* Flyouts for module menu items with sub-navigation (children) */}
        {hasModuleMenu && menuItems.filter((item) => (item.children?.length ?? 0) > 0).map((item) => (
          <Flyout key={item.href} open={activePanel === item.href} onClose={closePanel} title={item.label}>
            <div className="space-y-0.5 px-2">
              {item.children!.map((child) => (
                <AdminLink
                  key={child.href}
                  label={child.label}
                  path={child.href}
                  active={pathname === child.href || pathname.startsWith(child.href + '/')}
                  icon={getIcon(child.icon, 'h-4 w-4')}
                />
              ))}
            </div>
          </Flyout>
        ))}

        {/* Org Switcher flyout — always available, anchored to its trigger button */}
        <Flyout open={activePanel === 'orgs'} onClose={closePanel} title="Switch Organization" anchorRef={orgSwitcherRef}>
          <div className="px-2 py-1">
            {switching && (
              <p className="mb-2 text-[10px] text-gray-400 px-1">Switching...</p>
            )}
            {orgs.length === 0 && (
              <p className="px-3 py-2 text-sm text-gray-400">No organizations</p>
            )}
            {orgs.map((org, idx) => {
              const isActive = org.id === currentOrgId;
              const isSwitching = switching === org.id;
              const roleColors: Record<string, string> = { OWNER: 'bg-violet-100 text-violet-700', ADMIN: 'bg-blue-100 text-blue-700', MEMBER: 'bg-gray-100 text-gray-600' };
              return (
                <div key={org.id || idx} className={`group flex items-center gap-0.5 rounded-lg transition
                    ${isActive ? '' : 'hover:bg-gray-50 dark:hover:bg-white/5'}
                    ${isSwitching ? 'opacity-60' : ''}`}
                  style={isActive ? { backgroundColor: 'color-mix(in srgb, var(--gogo-primary) 8%, transparent)' } : undefined}>
                  <button onClick={() => handleOrgSwitch(org)} disabled={!!switching}
                    className="flex min-w-0 flex-1 items-center gap-2.5 px-2 py-2 text-left">
                    {orgLogoBlobUrls[org.id] ? (
                      <img src={orgLogoBlobUrls[org.id]} alt={org.name} className="h-7 w-7 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${orgGradient(idx)} text-[11px] font-bold text-white`}>
                        {org.name?.charAt(0)?.toUpperCase() || 'O'}
                      </div>
                    )}
                    <p className={`min-w-0 flex-1 truncate text-sm font-medium ${isActive ? '' : 'text-gray-700 dark:text-gray-300'}`}
                      style={isActive ? { color: 'var(--gogo-primary-dark)' } : undefined}>
                      {org.name}
                    </p>
                    {org.role && <span className={`shrink-0 rounded-full px-1.5 py-px text-[9px] font-bold uppercase ${roleColors[org.role.toUpperCase()] ?? roleColors.MEMBER}`}>{org.role}</span>}
                    {isActive && <svg className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--gogo-primary)' }} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                    {isSwitching && <svg className="h-3.5 w-3.5 shrink-0 animate-spin" style={{ color: 'var(--gogo-primary)' }} fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                  </button>
                  <a
                    href="/organization"
                    onClick={() => closePanel()}
                    title="Organization Settings"
                    className="mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md opacity-0 transition group-hover:opacity-60 hover:opacity-100"
                    style={{ color: 'var(--gogo-primary)' }}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </a>
                </div>
              );
            })}
            {orgs.length > 0 && (
              <>
                <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
                <a href="/admin/organizations" onClick={() => closePanel()} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-gray-50 dark:hover:bg-white/5"
                  style={{ color: 'var(--gogo-primary)' }}>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>
                  My Organizations
                </a>
                <a href="/organization/new" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-gray-50 dark:hover:bg-white/5"
                  style={{ color: 'var(--gogo-primary)' }}>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  Add Organization
                </a>
              </>
            )}
          </div>
        </Flyout>

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
              <AdminLink label="Organizations" path="/admin/organizations"
                icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" /></svg>} />
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
