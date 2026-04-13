'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { modules } from '@erp/shared';
import { getIcon } from './icons';
import { useCurrentUser, hasModuleAccess } from '../hooks/use-current-user';
import { useAuthStore } from '../store/auth';
import { authApi } from '../lib/api/auth';

const MODULE_COLORS: Record<string, string> = {
  home: 'bg-blue-600',
  finance: 'bg-emerald-500',
  apar: 'bg-lime-600',
  hr: 'bg-violet-500',
  sales: 'bg-blue-600',
  inventory: 'bg-amber-500',
  projects: 'bg-cyan-600',
  procurement: 'bg-rose-500',
  manufacturing: 'bg-indigo-500',
  reports: 'bg-teal-500',
  workflow: 'bg-orange-500',
  notifications: 'bg-pink-500',
  files: 'bg-slate-500',
  audit: 'bg-gray-600',
  integrations: 'bg-sky-600',
};

interface ModuleConfigRow {
  moduleId?: string;
  moduleKey?: string;
  enabled?: boolean;
}

function normalizeModuleId(value?: string | null): string | null {
  if (!value || typeof value !== 'string') return null;
  return value.trim().toLowerCase().replace(/_module$/, '');
}

function extractModuleConfigs(payload: unknown): ModuleConfigRow[] {
  const root = payload as { data?: unknown } | undefined;
  const inner = (root?.data as { data?: unknown } | undefined)?.data;
  if (Array.isArray(inner)) return inner as ModuleConfigRow[];
  if (Array.isArray(root?.data)) return root?.data as ModuleConfigRow[];
  if (Array.isArray(payload)) return payload as ModuleConfigRow[];
  return [];
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

export function AppSelector() {
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const [enabledKeys, setEnabledKeys] = useState<Set<string> | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close);
  const user = useCurrentUser();
  const userPermissions = user?.permissions ?? [];
  const accessToken = useAuthStore((s) => s.accessToken);
  const fullToken = useAuthStore((s) => s.fullAccessToken) || useAuthStore((s) => s.accessToken);

  const loadEnabledModules = useCallback(async () => {
    try {
      const res = await authApi.listModuleConfigs();
      const configs = extractModuleConfigs(res.data);
      const enabled = configs
        .filter((c) => !!c.enabled)
        .map((c) => normalizeModuleId(c.moduleKey ?? c.moduleId))
        .filter((v): v is string => !!v);

      // Unknown/empty payload => fail-open to avoid locking navigation.
      if (configs.length === 0) {
        setEnabledKeys(null);
        return;
      }

      setEnabledKeys(new Set(enabled));
    } catch {
      // fallback: show all modules if the endpoint is unavailable
      setEnabledKeys(null);
    }
    // NOTE: silentRefresh was removed here — it caused token-reuse revocations when
    // this effect ran concurrently (e.g. React StrictMode double-invoke or org switch),
    // triggering the backend's replay-attack detection and revoking all user sessions.
  }, []);

  useEffect(() => {
    loadEnabledModules();
    const handler = () => loadEnabledModules();
    window.addEventListener('erp:module-config-changed', handler);
    return () => {
      window.removeEventListener('erp:module-config-changed', handler);
    };
  }, [loadEnabledModules, accessToken]);

  // Only show modules the org has enabled (or all if fetch failed)
  const visibleModules = enabledKeys === null
    ? modules
    : modules.filter((m) => enabledKeys.has(normalizeModuleId(m.id) ?? m.id));

  const handleSelect = async (path: string, moduleId: string) => {
    // If we have a verified enabled-module list, any org member can enter enabled modules.
    // Fine-grained role/permission checks are enforced by each module's own pages and APIs.
    const normalizedModuleId = normalizeModuleId(moduleId) ?? moduleId;
    const isAllowed = enabledKeys !== null ? enabledKeys.has(normalizedModuleId) : hasModuleAccess(userPermissions, moduleId);
    if (!isAllowed || switching) return;
    setSwitching(moduleId);
    try {
      // Restore full token in memory before requesting a scoped one
      if (fullToken) {
        useAuthStore.setState({ accessToken: fullToken });
      }
      const { data } = await authApi.scopeToken({ module: moduleId });
      const scopedToken = data.data.accessToken;
      // Scoped token in memory only
      sessionStorage.setItem('activeModule', moduleId);
      useAuthStore.setState({ accessToken: scopedToken, activeModule: moduleId });
      setOpen(false);
      window.location.href = path;
    } catch {
      // Fallback: navigate without scoping if endpoint unavailable
      sessionStorage.setItem('activeModule', moduleId);
      useAuthStore.setState({ activeModule: moduleId });
      setOpen(false);
      window.location.href = path;
    } finally {
      setSwitching(null);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) loadEnabledModules();
        }}
        className={`flex h-11 w-11 items-center justify-center rounded-xl text-gray-600 transition-all duration-200 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm active:scale-95 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white ${open ? 'bg-gray-100 text-gray-900 shadow-sm dark:bg-white/10 dark:text-white' : ''}`}
        aria-label="Apps"
      >
        <svg className="h-[22px] w-[22px]" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="5" r="2" /><circle cx="12" cy="5" r="2" /><circle cx="19" cy="5" r="2" />
          <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
          <circle cx="5" cy="19" r="2" /><circle cx="12" cy="19" r="2" /><circle cx="19" cy="19" r="2" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[340px] rounded-2xl bg-white py-4 shadow-[var(--shadow-card)] ring-1 ring-[var(--gogo-divider)] z-50 dark:bg-[var(--gogo-surface)]">
          <div className="px-3 pb-2 border-b border-gray-100 dark:border-gray-700 mb-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">Navigation</p>
            <div className="mt-2">
              <button
                onClick={() => {
                  if (fullToken) {
                    useAuthStore.setState({ accessToken: fullToken, activeModule: undefined });
                  }
                  setOpen(false);
                  window.location.href = '/admin/modules';
                }}
                className="group flex w-full items-center gap-2 rounded-xl px-3 py-2 hover:bg-gray-100/80 dark:hover:bg-white/10 cursor-pointer transition"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full text-white shadow-sm transition group-hover:shadow-md group-hover:scale-105 shrink-0" style={{ background: 'linear-gradient(135deg, var(--gogo-primary) 0%, var(--gogo-secondary) 100%)' }}>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                </span>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Modules</span>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">Configure available modules</span>
                </div>
              </button>
            </div>
          </div>
          <div className="px-3 mb-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">Switch to</p>
          </div>
          <div className="grid grid-cols-4 gap-1 px-3">
            {visibleModules.map((mod) => {
              const icon = getIcon(mod.icon, "h-5 w-5");
              const color = MODULE_COLORS[mod.id] || 'bg-gray-500';
              const normalizedModId = normalizeModuleId(mod.id) ?? mod.id;
              const allowed = enabledKeys !== null ? enabledKeys.has(normalizedModId) : hasModuleAccess(userPermissions, mod.id);
              return (
                <button
                  key={mod.id}
                  onClick={() => handleSelect(mod.basePath, mod.id)}
                  disabled={!allowed || switching === mod.id}
                  title={allowed ? mod.name : `No access to ${mod.name}`}
                  className={`group flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 transition ${allowed
                    ? 'hover:bg-gray-100/80 dark:hover:bg-white/10 cursor-pointer'
                    : 'opacity-40 cursor-not-allowed'
                    }`}
                >
                  <span className={`relative flex h-11 w-11 items-center justify-center rounded-full ${color} text-white shadow-sm transition ${allowed ? 'group-hover:shadow-md group-hover:scale-105' : 'grayscale'}`}>
                    {switching === mod.id ? (
                      <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : icon}
                    {!allowed && (
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow">
                        <svg className="h-2.5 w-2.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </span>
                    )}
                  </span>
                  <span className={`text-[11px] font-medium leading-tight text-center line-clamp-1 ${allowed ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                    {mod.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
