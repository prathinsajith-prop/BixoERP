'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AppSelector } from './app-selector';
import { AlertsDropdown } from './alerts-dropdown';
import { authApi } from '../lib/api/auth';
import { useAuthStore } from '../store/auth';
import { usePageTitleState } from '../context/page-title';
import { useModuleMenu } from '../hooks/use-module-menu';

const ORG_GRADIENTS = [
  'from-violet-500 to-purple-600', 'from-blue-500 to-cyan-500', 'from-emerald-500 to-teal-500',
  'from-rose-500 to-pink-500', 'from-amber-500 to-orange-500', 'from-indigo-500 to-blue-600',
];

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

interface OrgRaw { organizationId?: string; id?: string; name: string; slug?: string; role?: string; }
interface Org { id: string; name: string; slug?: string; role?: string; }
function normalizeOrg(o: OrgRaw): Org {
  return { id: o.organizationId || o.id || '', name: o.name, slug: o.slug, role: o.role };
}

function OrgSelector() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Org | null>(null);
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close);

  useEffect(() => {
    authApi.myOrganizations().then((res: { data?: { data?: OrgRaw[] } }) => {
      const list = (res.data?.data || []).map(normalizeOrg);
      setOrgs(list);
      const storedId = typeof window !== 'undefined' ? localStorage.getItem('organizationId') : null;
      setCurrentOrg(list.find((o) => o.id === storedId) || list[0] || null);
    }).catch(() => { });
  }, []);

  const handleSwitch = async (org: Org) => {
    if (!org.id || org.id === currentOrg?.id) { setOpen(false); return; }
    setSwitching(org.id);
    setSwitchError(null);
    try {
      const res = await authApi.switchOrganization({ organizationId: org.id });
      const data = (res as { data?: { data?: { accessToken?: string; tenantId?: string } } }).data?.data;
      if (data?.accessToken) {
        useAuthStore.setState({ accessToken: data.accessToken, fullAccessToken: data.accessToken, isAuthenticated: true });
      }
      if (data?.tenantId) sessionStorage.setItem('tenantId', data.tenantId);
      localStorage.setItem('organizationId', org.id);
      window.location.reload();
    } catch {
      setSwitching(null);
      setSwitchError('Failed to switch organization. Please try again.');
      setTimeout(() => setSwitchError(null), 4000);
    }
  };

  const initial = currentOrg?.name?.charAt(0)?.toUpperCase() || 'O';
  const gradientIdx = orgs.findIndex((o) => o.id === currentOrg?.id);
  const gradient = ORG_GRADIENTS[(gradientIdx >= 0 ? gradientIdx : 0) % ORG_GRADIENTS.length];
  const roleColors: Record<string, string> = { Owner: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300', Admin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', Member: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 rounded-xl px-2 py-1.5 transition-all hover:bg-gray-100 dark:hover:bg-white/10 ${
          open ? 'bg-gray-100 dark:bg-white/10' : ''
        }`}
        style={open ? { outline: '2px solid var(--gogo-primary)', outlineOffset: '-2px' } : undefined}
      >
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} text-[11px] font-bold text-white`}>
          {initial}
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 max-w-[160px] truncate">
          {currentOrg?.name || 'Organization'}
        </span>
        <svg className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-72 rounded-xl bg-white py-2 shadow-xl ring-1 ring-gray-200/60 dark:bg-gray-800 dark:ring-gray-700">
          <p className="mb-1 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Organizations</p>
          {switchError && (
            <div className="mx-2 mb-1 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-300">{switchError}</div>
          )}
          {orgs.map((org, idx) => {
            const isActive = org.id === currentOrg?.id;
            const isSwitching = switching === org.id;
            return (
              <button key={org.id || idx} onClick={() => handleSwitch(org)} disabled={isSwitching}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition ${
                  isSwitching ? 'opacity-60' : ''
                }`}
                style={isActive ? { backgroundColor: 'color-mix(in srgb, var(--gogo-primary) 8%, transparent)' } : undefined}>
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${ORG_GRADIENTS[idx % ORG_GRADIENTS.length]} text-[11px] font-bold text-white`}>
                  {org.name?.charAt(0)?.toUpperCase() || 'O'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-medium ${isActive ? 'dark:text-purple-200' : 'text-gray-700 dark:text-gray-300'}`} style={isActive ? { color: 'var(--gogo-primary-dark)' } : undefined}>{org.name}</p>
                </div>
                {org.role && <span className={`shrink-0 rounded-full px-1.5 py-px text-[9px] font-bold uppercase tracking-wide ${roleColors[org.role] || roleColors.Member}`}>{org.role}</span>}
                {isActive && <svg className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--gogo-primary)' }} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                {isSwitching && <svg className="h-3.5 w-3.5 shrink-0 animate-spin" style={{ color: 'var(--gogo-primary)' }} fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
              </button>
            );
          })}
          <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
          <a href="/organization" className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Org Settings
          </a>
          <a href="/organization/new" className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition hover:bg-gray-50 dark:hover:bg-white/5" style={{ color: 'var(--gogo-primary)' }}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Add Organization
          </a>
        </div>
      )}
    </div>
  );
}

export function TopBar({ moduleId }: { moduleId?: string }) {
  const { title } = usePageTitleState();
  const { moduleName } = useModuleMenu(moduleId);

  return (
    <div className="gogo-header sticky top-0 z-20 flex w-full items-center justify-between px-5"
      style={{ height: 'var(--gogo-header-height)', backgroundColor: 'var(--gogo-surface)', boxShadow: 'var(--shadow-header)', borderBottomLeftRadius: 'var(--radius-sidebar)', borderBottomRightRadius: 'var(--radius-sidebar)' }}>
      <div className="min-w-0 flex-1">
        <OrgSelector />
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <AppSelector />
        <AlertsDropdown />
      </div>
    </div>
  );
}
