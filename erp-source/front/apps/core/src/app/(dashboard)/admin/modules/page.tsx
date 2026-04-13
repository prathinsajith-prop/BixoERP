'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getIcon, showToast, useCurrentUser } from '@erp/shell';
import { Button, Input, Stats, Skeleton, Modal, Drawer } from '@erp/ui';
import PageHeader from '@/components/page-header';
import { authApi } from '@/lib/api/auth';

// ─── Types ────────────────────────────────────────────────────────────

interface ManifestPermGroup { resource: string; actions: { id: string; name: string; description: string }[] }
interface ManifestModule {
  module: { id: string; name: string; version: string; description: string; namespace?: string };
  ui: { icon: string; color: string; basePath: string; position: number; menu: { label: string; href: string; icon: string; permission?: string }[] };
  tier?: string;
  compatibility: { dependencies: { module: string; optional: boolean }[] };
  roles: { id: string; name: string; description: string; scopes: string[] }[];
  permissions: ManifestPermGroup[];
}
interface RegisteredModule { moduleId: string; moduleKey: string; moduleName: string; currentVersion: string; previousVersion: string | null; tier: string; manifest: ManifestModule; registeredAt: string; }
interface OrgModuleConfig { moduleId: string; moduleKey: string; moduleName: string; tier: string; enabled: boolean; adoptedVersion: string | null; pendingVersion: string | null; hasUpdate: boolean; featureFlags: Record<string, boolean>; manifest: ManifestModule; settings: Record<string, unknown>; activatedAt: string | null; activatedBy: string | null; notes: string | null; }
interface OrgSummary { totalModules: number; enabledModules: number; pendingUpdates: number; enabledKeys: string[] }
interface Organization { id: string; name: string; slug?: string; status?: string }

// ─── Old-design color themes (per module key) ───────────────────────────────
const MODULE_THEME: Record<string, { color: string; ring: string; badge: string }> = {
  finance: { color: 'bg-emerald-50 dark:bg-emerald-900/20', ring: 'ring-emerald-200 dark:ring-emerald-800', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' },
  apar: { color: 'bg-blue-50 dark:bg-blue-900/20', ring: 'ring-blue-200 dark:ring-blue-800', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  hr: { color: 'bg-violet-50 dark:bg-violet-900/20', ring: 'ring-violet-200 dark:ring-violet-800', badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300' },
  inventory: { color: 'bg-amber-50 dark:bg-amber-900/20', ring: 'ring-amber-200 dark:ring-amber-800', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  sales: { color: 'bg-pink-50 dark:bg-pink-900/20', ring: 'ring-pink-200 dark:ring-pink-800', badge: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300' },
  procurement: { color: 'bg-cyan-50 dark:bg-cyan-900/20', ring: 'ring-cyan-200 dark:ring-cyan-800', badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300' },
  manufacturing: { color: 'bg-orange-50 dark:bg-orange-900/20', ring: 'ring-orange-200 dark:ring-orange-800', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
  projects: { color: 'bg-indigo-50 dark:bg-indigo-900/20', ring: 'ring-indigo-200 dark:ring-indigo-800', badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' },
  reports: { color: 'bg-teal-50 dark:bg-teal-900/20', ring: 'ring-teal-200 dark:ring-teal-800', badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300' },
  workflow: { color: 'bg-fuchsia-50 dark:bg-fuchsia-900/20', ring: 'ring-fuchsia-200 dark:ring-fuchsia-800', badge: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900 dark:text-fuchsia-300' },
  notifications: { color: 'bg-rose-50 dark:bg-rose-900/20', ring: 'ring-rose-200 dark:ring-rose-800', badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300' },
  files: { color: 'bg-sky-50 dark:bg-sky-900/20', ring: 'ring-sky-200 dark:ring-sky-800', badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300' },
  audit: { color: 'bg-stone-50 dark:bg-stone-900/20', ring: 'ring-stone-200 dark:ring-stone-800', badge: 'bg-stone-100 text-stone-700 dark:bg-stone-900 dark:text-stone-300' },
  integrations: { color: 'bg-lime-50 dark:bg-lime-900/20', ring: 'ring-lime-200 dark:ring-lime-800', badge: 'bg-lime-100 text-lime-700 dark:bg-lime-900 dark:text-lime-300' },
};
const INACTIVE_THEME = { color: 'bg-white dark:bg-gray-800', ring: 'ring-gray-100 dark:ring-gray-700', badge: 'bg-gray-100 text-gray-400' };
const DEFAULT_THEME = { color: 'bg-gray-50 dark:bg-gray-900/20', ring: 'ring-gray-200 dark:ring-gray-700', badge: 'bg-gray-100 text-gray-600' };
function getTheme(key: string, enabled?: boolean) {
  if (enabled === false) return INACTIVE_THEME;
  return MODULE_THEME[key.replace(/_module$/, '')] ?? DEFAULT_THEME;
}

// ─── Toggle (old design: h-6 w-11, blue) ─────────────────────────────────────
function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={onChange} disabled={disabled}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'}`}>
      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}

// ─── ModuleIcon ────────────────────────────────────────────────────────────────
function ModuleIcon({ moduleKey, iconName, theme }: { moduleKey: string; iconName?: string; theme: { badge: string } }) {
  return (
    <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${theme.badge}`}>
      {iconName ? getIcon(iconName, 'h-5 w-5') : moduleKey.replace(/_module$/, '').charAt(0).toUpperCase()}
    </span>
  );
}

// ─── RegistryCard (old design style) ─────────────────────────────────────────
function RegistryCard({ mod }: { mod: RegisteredModule }) {
  const [expanded, setExpanded] = useState(false);
  const theme = getTheme(mod.moduleKey);
  const totalPerms = mod.manifest?.permissions?.reduce((s, gr) => s + (gr.actions?.length ?? 0), 0) ?? 0;
  return (
    <div className={`rounded-2xl ring-1 transition-all ${theme.color} ${theme.ring}`}>
      <div className="p-5 space-y-3">
        <div className="flex items-start gap-3">
          <ModuleIcon moduleKey={mod.moduleKey} iconName={mod.manifest?.ui?.icon} theme={theme} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">{mod.moduleName}</h3>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${theme.badge}`}>{mod.tier}</span>
              <span className="text-[10px] font-mono rounded px-1.5 py-0.5 bg-white/60 dark:bg-black/20 text-gray-500">v{mod.currentVersion}</span>
            </div>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{mod.manifest?.module?.description ?? ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
          <span>{totalPerms} permissions</span>
          <span>{mod.manifest?.roles?.length ?? 0} roles</span>
          <span>{mod.manifest?.ui?.menu?.length ?? 0} pages</span>
        </div>
        <button onClick={() => setExpanded(e => !e)} className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
          {expanded ? 'Hide Details ↑' : `View ${totalPerms} Permissions ↓`}
        </button>
        {expanded && (
          <div className="space-y-3">
            {(mod.manifest?.permissions ?? []).map(group => (
              <div key={group.resource}>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">{group.resource}</p>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {group.actions?.map(action => (
                    <li key={action.id} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                      <svg className="h-3 w-3 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      {action.name}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── OrgModuleCard ─────────────────────────────────────────────────────────────
function OrgModuleCard({ cfg, saving, canWrite, onToggle, onAdopt, onEdit }: {
  cfg: OrgModuleConfig; saving: boolean; canWrite: boolean;
  onToggle: (id: string, en: boolean) => void; onAdopt: (id: string) => void; onEdit: (cfg: OrgModuleConfig) => void;
}) {
  const theme = getTheme(cfg.moduleKey, cfg.enabled);
  const totalPerms = (cfg.manifest?.permissions ?? []).reduce((s, gr) => s + (gr.actions?.length ?? 0), 0);
  const enabledFlagCount = Object.values(cfg.featureFlags).filter(Boolean).length;
  return (
    <div className={`group rounded-2xl ring-1 transition-all duration-200 hover:shadow-md ${theme.color} ${theme.ring}`}>
      {/* Clickable body → opens drawer */}
      <button type="button" className="w-full text-left p-5 space-y-3" onClick={() => onEdit(cfg)}>
        {/* Header row */}
        <div className="flex items-start gap-3">
          <ModuleIcon moduleKey={cfg.moduleKey} iconName={cfg.manifest?.ui?.icon} theme={theme} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">{cfg.moduleName}</h3>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${theme.badge}`}>{cfg.tier}</span>
              {cfg.adoptedVersion && (
                <span className="text-[10px] font-mono rounded px-1.5 py-0.5 bg-white/60 dark:bg-black/20 text-gray-500">v{cfg.adoptedVersion}</span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{cfg.manifest?.module?.description ?? ''}</p>
          </div>
        </div>

        {/* Update banner */}
        {cfg.hasUpdate && cfg.pendingVersion && (
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-200 dark:ring-blue-800 px-3 py-2">
            <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
              Update available: v{cfg.adoptedVersion} → v{cfg.pendingVersion}
            </p>
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 text-[11px] text-gray-400 dark:text-gray-500">
          {totalPerms > 0 && <span>{totalPerms} permissions</span>}
          {(cfg.manifest?.roles?.length ?? 0) > 0 && <span>{cfg.manifest.roles.length} roles</span>}
          {(cfg.manifest?.ui?.menu?.length ?? 0) > 0 && <span>{cfg.manifest.ui.menu.length} pages</span>}
          {totalPerms > 0 && <span className="ml-auto text-[10px] font-medium text-gray-400">{enabledFlagCount}/{totalPerms} features on</span>}
        </div>

        {/* Open hint */}
        <div className="flex items-center justify-between pt-0.5">
          <span className="text-[10px] font-medium text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors flex items-center gap-1">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>
            Configure
          </span>
          <svg className="h-4 w-4 text-gray-300 dark:text-gray-600 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
        </div>
      </button>

      {/* Enable / disable toggle — sits outside the clickable area */}
      <div className="px-5 pb-4 -mt-1 flex items-center justify-between">
        <span className={`text-[11px] font-medium ${cfg.enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
          {cfg.enabled ? 'Enabled' : 'Disabled'}
        </span>
        <Toggle checked={cfg.enabled} onChange={() => onToggle(cfg.moduleId, !cfg.enabled)} disabled={!canWrite || saving} />
      </div>
    </div>
  );
}

// ─── ModuleDrawer ─────────────────────────────────────────────────────────────
type DrawerTab = 'info' | 'features' | 'menu' | 'notes' | 'manifest';

function ModuleDrawer({ cfg, open, onClose, selectedOrgId, canWrite, onSaved, onToggle, onFeatureToggle, onAdopt, saving }: {
  cfg: OrgModuleConfig | null; open: boolean; onClose: () => void; selectedOrgId: string | null;
  canWrite: boolean; saving: boolean;
  onSaved: () => void;
  onToggle: (id: string, en: boolean) => void;
  onFeatureToggle: (id: string, perm: string, val: boolean) => void;
  onAdopt: (id: string) => void;
}) {
  const [tab, setTab] = useState<DrawerTab>('info');
  const [notes, setNotes] = useState('');
  const [menuJson, setMenuJson] = useState('');
  const [menuError, setMenuError] = useState<string | null>(null);
  const [innerSaving, setInnerSaving] = useState(false);

  useEffect(() => {
    if (cfg) {
      setNotes(cfg.notes ?? '');
      const menuOverride = (cfg.settings?.menuOverride as unknown[] | undefined);
      const menuSource = menuOverride ?? cfg.manifest?.ui?.menu ?? [];
      setMenuJson(JSON.stringify(menuSource, null, 2));
      setMenuError(null);
    }
  }, [cfg]);

  // Reset to info tab when a different module is opened
  useEffect(() => { if (open) setTab('info'); }, [cfg?.moduleId, open]);

  const handleSaveNotes = async () => {
    if (!selectedOrgId || !cfg) return;
    setInnerSaving(true);
    try {
      await authApi.updateOrgModule(selectedOrgId, cfg.moduleId, { notes });
      onSaved();
      showToast.success('Notes saved');
    } catch { showToast.error('Failed to save notes'); } finally { setInnerSaving(false); }
  };

  const handleSaveMenu = async () => {
    if (!selectedOrgId || !cfg) return;
    setMenuError(null);
    let parsed: unknown[];
    try {
      const v = JSON.parse(menuJson);
      if (!Array.isArray(v)) throw new Error('Must be a JSON array');
      parsed = v;
    } catch (e: unknown) {
      setMenuError((e as Error).message);
      return;
    }
    setInnerSaving(true);
    try {
      await authApi.updateOrgModule(selectedOrgId, cfg.moduleId, { menuOverride: parsed });
      onSaved();
      showToast.success('Menu override saved');
    } catch { showToast.error('Failed to save menu override'); } finally { setInnerSaving(false); }
  };

  const handleResetMenu = async () => {
    if (!selectedOrgId || !cfg) return;
    setInnerSaving(true);
    try {
      await authApi.updateOrgModule(selectedOrgId, cfg.moduleId, { menuOverride: null });
      onSaved();
      showToast.success('Menu reset to default');
    } catch { showToast.error('Failed to reset menu'); } finally { setInnerSaving(false); }
  };

  const isBusy = innerSaving || saving;

  const tabs: { id: DrawerTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'info', label: 'Info',
      icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>,
    },
    {
      id: 'features', label: 'Features',
      icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>,
    },
    {
      id: 'menu', label: 'Menu JSON',
      icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" /></svg>,
    },
    {
      id: 'notes', label: 'Notes',
      icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>,
    },
    {
      id: 'manifest', label: 'Manifest',
      icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>,
    },
  ];

  if (!cfg) return null;

  const totalPerms = (cfg.manifest?.permissions ?? []).reduce((s, gr) => s + (gr.actions?.length ?? 0), 0);
  const theme = getTheme(cfg.moduleKey, cfg.enabled);

  return (
    <Drawer open={open} onClose={onClose} size="lg" title={cfg.moduleName}>
      <div className="flex flex-col h-full -mt-2">
        {/* Module header with icon + key + inline toggle */}
        <div className="flex items-center gap-3 px-1 pb-4 mb-1 border-b border-gray-100 dark:border-gray-700/60 shrink-0">
          <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${theme.badge}`}>
            {cfg.manifest?.ui?.icon ? getIcon(cfg.manifest.ui.icon, 'h-5 w-5') : cfg.moduleKey.replace(/_module$/, '').charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-400 dark:text-gray-500 font-mono truncate">{cfg.moduleKey}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-xs font-medium ${cfg.enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
              {cfg.enabled ? 'Enabled' : 'Disabled'}
            </span>
            <Toggle checked={cfg.enabled} onChange={() => onToggle(cfg.moduleId, !cfg.enabled)} disabled={!canWrite || isBusy} />
          </div>
        </div>
        {/* Tab bar */}
        <div className="flex gap-0.5 border-b border-gray-200 dark:border-gray-700 mb-5 shrink-0 overflow-x-auto no-scrollbar">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap -mb-px shrink-0 ${tab === t.id
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}>
              {t.icon}
              {t.label}
              {t.id === 'features' && totalPerms > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none ${tab === t.id ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                  {totalPerms}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Info ── */}
        {tab === 'info' && (
          <div className="space-y-5 overflow-y-auto flex-1 pr-1">
            {/* Update banner */}
            {cfg.hasUpdate && cfg.pendingVersion && (
              <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-200 dark:ring-blue-800 px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Update available</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">v{cfg.adoptedVersion} → v{cfg.pendingVersion}</p>
                </div>
                {canWrite && (
                  <Button size="sm" variant="primary" onClick={() => onAdopt(cfg.moduleId)} disabled={isBusy}>
                    Adopt
                  </Button>
                )}
              </div>
            )}

            {/* Details grid */}
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 divide-y divide-gray-100 dark:divide-gray-700/60 overflow-hidden">
              {[
                { label: 'Module ID', value: cfg.moduleId, mono: true },
                { label: 'Key', value: cfg.moduleKey, mono: true },
                { label: 'Version', value: cfg.adoptedVersion ? `v${cfg.adoptedVersion}` : '—' },
                { label: 'Tier', value: cfg.tier },
                { label: 'Status', value: cfg.enabled ? 'Enabled' : 'Disabled', highlight: cfg.enabled ? 'emerald' as const : 'gray' as const },
                { label: 'Base path', value: cfg.manifest?.ui?.basePath ?? '—', mono: true },
                { label: 'Activated', value: cfg.activatedAt ? new Date(cfg.activatedAt).toLocaleString() : '—' },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between px-4 py-2.5 gap-4">
                  <span className="text-xs font-medium text-gray-500 shrink-0">{row.label}</span>
                  {row.highlight ? (
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${row.highlight === 'emerald' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                      {row.value}
                    </span>
                  ) : (
                    <span className={`text-xs text-gray-900 dark:text-white text-right ${row.mono ? 'font-mono' : ''}`}>{row.value}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Description */}
            {cfg.manifest?.module?.description && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Description</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{cfg.manifest.module.description}</p>
              </div>
            )}

            {/* Dependencies */}
            {cfg.manifest?.compatibility?.dependencies?.length ? (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Dependencies</p>
                <div className="flex flex-wrap gap-1.5">
                  {cfg.manifest.compatibility.dependencies.map(d => (
                    <span key={d.module} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${d.optional ? 'bg-gray-50 text-gray-500 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700' : 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/20 dark:ring-amber-800 dark:text-amber-400'}`}>
                      {d.module.replace(/_module$/, '')}
                      {d.optional ? <span className="text-[9px] opacity-60">optional</span> : null}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Roles */}
            {cfg.manifest?.roles?.length ? (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Roles</p>
                <div className="space-y-1.5">
                  {cfg.manifest.roles.map(role => (
                    <div key={role.id} className="rounded-lg bg-gray-50 dark:bg-gray-800/50 px-3 py-2 flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{role.name}</p>
                        {role.description && <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{role.description}</p>}
                      </div>
                      <span className="text-[10px] text-gray-400 shrink-0">{role.scopes?.length ?? 0} scopes</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* ── Features ── */}
        {tab === 'features' && (
          <div className="flex-1 overflow-y-auto pr-1 space-y-5">
            {totalPerms === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <svg className="h-10 w-10 text-gray-200 dark:text-gray-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No configurable features</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">This module does not define any feature flags</p>
              </div>
            ) : (
              (cfg.manifest?.permissions ?? []).map(group => {
                const on = group.actions?.filter(a => cfg.featureFlags[a.id] !== false).length ?? 0;
                const total = group.actions?.length ?? 0;
                return (
                  <div key={group.resource}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{group.resource}</p>
                      <span className={`text-[10px] font-medium rounded-full px-2 py-0.5 ${on === total ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : on === 0 ? 'bg-gray-100 text-gray-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                        {on}/{total} on
                      </span>
                    </div>
                    <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 divide-y divide-gray-100 dark:divide-gray-700/60 overflow-hidden">
                      {group.actions?.map(action => (
                        <div key={action.id} className="flex items-center justify-between px-4 py-3 gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{action.name}</p>
                            {action.description && (
                              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1">{action.description}</p>
                            )}
                          </div>
                          <Toggle
                            checked={cfg.featureFlags[action.id] !== false}
                            onChange={() => onFeatureToggle(cfg.moduleId, action.id, cfg.featureFlags[action.id] === false)}
                            disabled={!canWrite}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── Menu JSON ── */}
        {tab === 'menu' && (
          <div className="flex flex-col flex-1 gap-4 overflow-hidden">
            <div className="flex items-start justify-between gap-3 shrink-0">
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Edit the navigation menu items for this module. Stored as an org-level override — does not affect other organizations.
              </p>
              {(cfg.settings?.menuOverride as unknown[] | undefined) && (
                <button onClick={handleResetMenu} disabled={isBusy}
                  className="shrink-0 text-[11px] font-medium text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 transition-colors">
                  Reset to default
                </button>
              )}
            </div>
            {menuError && (
              <div className="rounded-lg bg-rose-50 dark:bg-rose-900/20 px-3 py-2 flex items-center gap-2 shrink-0">
                <svg className="h-3.5 w-3.5 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                <p className="text-xs text-rose-600 dark:text-rose-400">{menuError}</p>
              </div>
            )}
            <textarea
              value={menuJson}
              onChange={e => setMenuJson(e.target.value)}
              spellCheck={false}
              className="flex-1 w-full font-mono text-xs resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[280px]"
            />
            <div className="shrink-0 flex justify-end">
              <Button size="sm" variant="primary" onClick={handleSaveMenu} disabled={isBusy}>
                {isBusy ? 'Saving…' : 'Save Menu'}
              </Button>
            </div>
          </div>
        )}

        {/* ── Notes ── */}
        {tab === 'notes' && (
          <div className="flex flex-col flex-1 gap-4 overflow-hidden">
            <p className="text-xs text-gray-500 dark:text-gray-400 shrink-0 leading-relaxed">
              Internal notes for this module configuration. Visible only to administrators — not shown to end users.
            </p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add notes about this module's configuration, customisations, or known issues…"
              className="flex-1 w-full text-sm resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[200px]"
            />
            <div className="shrink-0 flex justify-end">
              <Button size="sm" variant="primary" onClick={handleSaveNotes} disabled={isBusy}>
                {isBusy ? 'Saving…' : 'Save Notes'}
              </Button>
            </div>
          </div>
        )}

        {/* ── Manifest ── */}
        {tab === 'manifest' && (
          <div className="flex flex-col flex-1 overflow-hidden gap-3">
            <div className="flex items-center justify-between shrink-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">Read-only registered manifest</p>
              <button
                onClick={() => navigator.clipboard.writeText(JSON.stringify(cfg.manifest, null, 2))}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>
                Copy JSON
              </button>
            </div>
            <pre className="flex-1 overflow-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-4 text-[11px] font-mono leading-relaxed">
              {JSON.stringify(cfg.manifest, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Drawer>
  );
}

export default function ModulesPage() {
  const currentUser = useCurrentUser();
  const permissions = currentUser?.permissions ?? [];
  const orgRole = (currentUser?.orgRole ?? '').toUpperCase();
  const canWrite = permissions.includes('auth:modules:write') || permissions.includes('auth:organizations:write') || orgRole === 'OWNER' || orgRole === 'ADMIN';

  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [orgSearch, setOrgSearch] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<Record<string, OrgSummary>>({});
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [orgsError, setOrgsError] = useState<string | null>(null);

  const [registry, setRegistry] = useState<RegisteredModule[]>([]);
  const [registryLoading, setRegistryLoading] = useState(false);
  const [registryError, setRegistryError] = useState<string | null>(null);

  const [orgModules, setOrgModules] = useState<OrgModuleConfig[]>([]);
  const [orgLoading, setOrgLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [presetModal, setPresetModal] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<'starter' | 'standard' | 'full'>('standard');
  const [applyingPreset, setApplyingPreset] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerModuleId, setDrawerModuleId] = useState<string | null>(null);
  // Derived from live orgModules so the drawer always reflects the current state
  const drawerCfg = useMemo(
    () => (drawerModuleId ? orgModules.find((m) => m.moduleId === drawerModuleId) ?? null : null),
    [drawerModuleId, orgModules],
  );
  const handleOpenDrawer = useCallback((cfg: OrgModuleConfig) => {
    setDrawerModuleId(cfg.moduleId);
    setDrawerOpen(true);
  }, []);

  useEffect(() => {
    setOrgsLoading(true);
    setOrgsError(null);
    authApi.listOrganizations({ page: 1, limit: 100, _ts: Date.now() }).then(async res => {
      const payload = (res.data as any)?.data;
      const raw = payload?.organizations ?? payload?.data ?? payload ?? [];
      const list: Organization[] = Array.isArray(raw) ? raw : [];
      setOrgs(list);
      const pairs = await Promise.all(list.map(org => authApi.getOrgModuleSummary(org.id).then(r => { const s = (r.data as any)?.data; return { id: org.id, s: s && typeof s === 'object' && !Array.isArray(s) ? s as OrgSummary : undefined }; }).catch(() => ({ id: org.id, s: undefined }))));
      const map: Record<string, OrgSummary> = {};
      pairs.forEach(p => { if (p.s) map[p.id] = p.s; });
      setSummaries(map);
    }).catch((err: unknown) => {
      setOrgs([]);
      const e = err as { response?: { status?: number } };
      if (e?.response?.status === 401) setOrgsError('Session expired while loading organizations. Please sign in again.');
      else if (e?.response?.status === 403) setOrgsError('Your account does not have permission to list organizations.');
      else setOrgsError('Failed to load organizations.');
    }).finally(() => setOrgsLoading(false));
  }, []);

  useEffect(() => {
    if (selectedOrgId) return;
    setRegistryLoading(true);
    setRegistryError(null);
    authApi.listRegisteredModules().then(res => {
      const d = (res.data as any)?.data;
      setRegistry(Array.isArray(d) ? d : []);
    }).catch((err: unknown) => {
      setRegistry([]);
      const e = err as { response?: { status?: number } };
      if (e?.response?.status === 401) setRegistryError('Your session is not authorized for the module registry. Sign in again and retry.');
      else if (e?.response?.status === 403) setRegistryError('Your account does not have permission to view the module registry.');
      else setRegistryError('Failed to load the module registry from the core service.');
    }).finally(() => setRegistryLoading(false));
  }, [selectedOrgId]);

  const loadOrgModules = useCallback(async (orgId: string) => {
    setOrgLoading(true);
    try { const res = await authApi.getOrgModules(orgId); const d = (res.data as any)?.data; setOrgModules(Array.isArray(d) ? d : []); } catch { setOrgModules([]); } finally { setOrgLoading(false); }
  }, []);

  useEffect(() => { if (selectedOrgId) loadOrgModules(selectedOrgId); }, [selectedOrgId, loadOrgModules]);

  const handleToggleModule = useCallback(async (moduleId: string, enabled: boolean) => {
    if (!selectedOrgId) return;
    setSaving(true);
    let updateFailed = false;
    try {
      await authApi.updateOrgModule(selectedOrgId, moduleId, { enabled });
      showToast.success(enabled ? 'Module enabled' : 'Module disabled');
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { message?: string; missingDependencies?: string[]; conflictingModules?: string[] } } };
      const d = e?.response?.data;
      if (e?.response?.status === 409) {
        if (d?.missingDependencies?.length) {
          showToast.error(`Cannot enable: missing dependencies`, `Enable ${d.missingDependencies.map((m: string) => m.replace(/_module$/, '')).join(', ')} first`);
        } else if (d?.conflictingModules?.length) {
          showToast.error(`Cannot disable: other modules depend on this`, `${d.conflictingModules.map((m: string) => m.replace(/_module$/, '')).join(', ')} must be disabled first`);
        } else {
          showToast.error('Conflict', d?.message ?? 'Cannot update module due to a conflict');
        }
        updateFailed = true;
      } else {
        // Non-conflict errors (e.g. permission seeding failures): the enabled flag was
        // still written to the DB before the error occurred, so reload the list and
        // fire the module-config event so the app-selector reflects the real DB state.
        showToast.error('Module updated but post-processing failed', d?.message);
      }
    } finally {
      // Always refresh the admin list and notify the app-selector – even on post-processing
      // errors – so the UI matches what is actually stored in the database.
      if (!updateFailed) {
        await loadOrgModules(selectedOrgId);
        const sr = await authApi.getOrgModuleSummary(selectedOrgId).catch(() => null);
        if (sr) setSummaries(p => ({ ...p, [selectedOrgId]: (sr.data as any)?.data }));
        window.dispatchEvent(new CustomEvent('erp:module-config-changed'));
      }
      setSaving(false);
    }
  }, [selectedOrgId, loadOrgModules]);

  const handleFeatureToggle = useCallback(async (moduleId: string, permId: string, value: boolean) => {
    if (!selectedOrgId) return;
    setOrgModules(p => p.map(m => m.moduleId === moduleId ? { ...m, featureFlags: { ...m.featureFlags, [permId]: value } } : m));
    try {
      await authApi.updateOrgModule(selectedOrgId, moduleId, { featureFlags: { [permId]: value } });
      window.dispatchEvent(new CustomEvent('erp:module-config-changed'));
    }
    catch { showToast.error('Failed'); setOrgModules(p => p.map(m => m.moduleId === moduleId ? { ...m, featureFlags: { ...m.featureFlags, [permId]: !value } } : m)); }
  }, [selectedOrgId]);

  const handleAdopt = useCallback(async (moduleId: string) => {
    if (!selectedOrgId) return;
    setSaving(true);
    try { await authApi.updateOrgModule(selectedOrgId, moduleId, { adoptVersion: true }); await loadOrgModules(selectedOrgId); showToast.success('Version adopted'); }
    catch { showToast.error('Failed to adopt version'); } finally { setSaving(false); }
  }, [selectedOrgId, loadOrgModules]);

  const handleApplyPreset = useCallback(async () => {
    if (!selectedOrgId) return;
    setApplyingPreset(true);
    try {
      await authApi.applyModulePreset(selectedOrgId, { preset: selectedPreset });
      await loadOrgModules(selectedOrgId);
      const sr = await authApi.getOrgModuleSummary(selectedOrgId);
      setSummaries(p => ({ ...p, [selectedOrgId]: (sr.data as any)?.data }));
      window.dispatchEvent(new CustomEvent('erp:module-config-changed'));
      showToast.success('Preset applied'); setPresetModal(false);
    } catch { showToast.error('Failed to apply preset'); } finally { setApplyingPreset(false); }
  }, [selectedOrgId, selectedPreset, loadOrgModules]);

  const filteredOrgs = useMemo(() => { const q = orgSearch.toLowerCase(); return q ? orgs.filter(o => o.name.toLowerCase().includes(q)) : orgs; }, [orgs, orgSearch]);
  const filteredModules = useMemo(() => { const q = search.toLowerCase(); return orgModules.filter(m => { if (q && !m.moduleName.toLowerCase().includes(q) && !m.moduleKey.toLowerCase().includes(q)) return false; if (statusFilter === 'active' && !m.enabled) return false; if (statusFilter === 'inactive' && m.enabled) return false; return true; }); }, [orgModules, search, statusFilter]);
  const filteredRegistry = useMemo(() => { const q = search.toLowerCase(); return q ? registry.filter(m => m.moduleName.toLowerCase().includes(q) || m.moduleKey.toLowerCase().includes(q)) : registry; }, [registry, search]);

  const selectedOrg = orgs.find(o => o.id === selectedOrgId);
  const activeCount = orgModules.filter(m => m.enabled).length;
  const updateCount = orgModules.filter(m => m.hasUpdate).length;

  const statsMetrics = selectedOrgId
    ? [
      { label: 'Total Modules', value: orgModules.length, color: 'primary' as const },
      { label: 'Active', value: activeCount, color: 'success' as const },
      { label: 'Inactive', value: orgModules.length - activeCount, color: 'warning' as const },
      ...(updateCount > 0 ? [{ label: 'Updates', value: updateCount, color: 'info' as const }] : []),
    ]
    : [
      { label: 'Registered Modules', value: registry.length, color: 'primary' as const },
      { label: 'Organizations', value: orgs.length, color: 'success' as const },
    ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Module Management"
        subtitle="Configure and manage ERP modules per organization"
        actions={
          selectedOrgId && canWrite
            ? <Button size="sm" variant="primary" onClick={() => setPresetModal(true)}>Apply Preset</Button>
            : undefined
        }
      />

      {/* Stats bar */}
      <Stats metrics={statsMetrics} columns={(statsMetrics.length >= 4 ? 4 : statsMetrics.length) as 1 | 2 | 3 | 4} />

      {/* Org / view selector (pill tabs like old design category tabs) */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Select View</p>
        {orgsError && (
          <p className="text-xs text-rose-600 dark:text-rose-400">{orgsError}</p>
        )}
        {orgsLoading ? (
          <div className="flex gap-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-24 rounded-full" />)}</div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {/* Global Registry pill */}
            <button
              onClick={() => setSelectedOrgId(null)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${!selectedOrgId ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'}`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zm0 9.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zm9.75-9.75A2.25 2.25 0 0115.75 3.75H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zm0 9.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
              Global Registry
            </button>
            {/* Per-org pills */}
            {filteredOrgs.map(org => (
              <button
                key={org.id}
                onClick={() => setSelectedOrgId(org.id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${selectedOrgId === org.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'}`}
              >
                {org.name}
                {(summaries[org.id]?.pendingUpdates ?? 0) > 0 && (
                  <span className={`h-1.5 w-1.5 rounded-full ${selectedOrgId === org.id ? 'bg-yellow-300' : 'bg-yellow-500'}`} />
                )}
              </button>
            ))}
            {/* Search if many orgs */}
            {orgs.length > 8 && (
              <Input placeholder="Search orgs…" value={orgSearch} onChange={e => setOrgSearch(e.target.value)} className="text-xs h-8 w-36 rounded-full" />
            )}
          </div>
        )}
      </div>

      {/* Search + status filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          type="text"
          placeholder={selectedOrgId ? 'Search modules…' : 'Search registry…'}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-48"
        />
        {selectedOrgId && (
          <div className="flex gap-1">
            {(['all', 'active', 'inactive'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium border transition-colors capitalize ${statusFilter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              >{s}</button>
            ))}
          </div>
        )}
        {selectedOrg && (
          <p className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
            {activeCount} of {orgModules.length} enabled
            {updateCount > 0 && <span className="ml-2 text-amber-600 font-medium">· {updateCount} updates</span>}
          </p>
        )}
      </div>

      {/* Cards grid */}
      {!selectedOrgId ? (
        registryLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl ring-1 ring-gray-100 dark:ring-gray-700 bg-white dark:bg-gray-800 p-5 space-y-3">
                <div className="flex gap-3"><Skeleton className="h-9 w-9 rounded-xl shrink-0" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-28" /><Skeleton className="h-3 w-full" /></div></div>
              </div>
            ))}
          </div>
        ) : registryError ? (
          <div className="rounded-2xl ring-1 ring-rose-100 dark:ring-rose-900/40 bg-white dark:bg-gray-800 py-20 text-center">
            <p className="text-sm font-medium text-rose-600 dark:text-rose-400">Unable to load modules</p>
            <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">{registryError}</p>
          </div>
        ) : filteredRegistry.length === 0 ? (
          <div className="rounded-2xl ring-1 ring-gray-100 dark:ring-gray-700 bg-white dark:bg-gray-800 py-20 text-center">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No modules registered</p>
            <p className="text-xs mt-1 text-gray-400 dark:text-gray-500">All modules should appear here from the core registry, even when they are disabled for an organization.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRegistry.map(mod => <RegistryCard key={mod.moduleId} mod={mod} />)}
          </div>
        )
      ) : (
        orgLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="rounded-2xl ring-1 ring-gray-100 dark:ring-gray-700 bg-white dark:bg-gray-800 p-5 space-y-3">
                <div className="flex gap-3"><Skeleton className="h-9 w-9 rounded-xl shrink-0" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-28" /><Skeleton className="h-3 w-full" /></div></div>
              </div>
            ))}
          </div>
        ) : filteredModules.length === 0 ? (
          <div className="rounded-2xl ring-1 ring-gray-100 dark:ring-gray-700 bg-white dark:bg-gray-800 py-20 text-center">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No modules found</p>
            <p className="text-xs mt-1 text-gray-400 dark:text-gray-500">Try changing the filter or select a different organization</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredModules.map(cfg => (
              <OrgModuleCard key={cfg.moduleId} cfg={cfg} saving={saving} canWrite={canWrite} onToggle={handleToggleModule} onAdopt={handleAdopt} onEdit={handleOpenDrawer} />
            ))}
          </div>
        )
      )}

      {/* Module Details Drawer */}
      <ModuleDrawer
        cfg={drawerCfg}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setDrawerModuleId(null); }}
        selectedOrgId={selectedOrgId}
        canWrite={canWrite}
        saving={saving}
        onToggle={handleToggleModule}
        onFeatureToggle={handleFeatureToggle}
        onAdopt={handleAdopt}
        onSaved={() => { if (selectedOrgId) loadOrgModules(selectedOrgId); }}
      />

      {/* Preset Modal */}
      <Modal open={presetModal} onClose={() => setPresetModal(false)} title="Apply Module Preset" size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setPresetModal(false)} disabled={applyingPreset}>Cancel</Button>
            <Button variant="primary" onClick={handleApplyPreset} disabled={applyingPreset}>{applyingPreset ? 'Applying…' : 'Apply preset'}</Button>
          </>
        }
      >
        <div className="space-y-2">
          {(['starter', 'standard', 'full'] as const).map(p => {
            const info = { starter: { label: 'Starter', desc: 'Workflow, Notifications, Files, Audit' }, standard: { label: 'Standard', desc: 'Starter + HR, Finance, AP/AR, Reports' }, full: { label: 'Full', desc: 'All registered modules' } }[p];
            return (
              <button key={p} onClick={() => setSelectedPreset(p)}
                className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${selectedPreset === p ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{info.label}</p>
                <p className="text-xs mt-0.5 text-gray-500 dark:text-gray-400">{info.desc}</p>
              </button>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}
