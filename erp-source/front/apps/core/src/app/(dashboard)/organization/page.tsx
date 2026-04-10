'use client';

import { useState, useEffect, useRef, type ReactNode } from 'react';
import { authApi } from '@/lib/api/auth';
import { filesApi } from '@/lib/api/files';
import { Input, Select, Textarea, Switch, OrgSettingsSkeleton } from '@erp/ui';


const SECTIONS = [
  { key: 'general', label: 'General', icon: 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  { key: 'branding', label: 'Branding', icon: 'M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42' },
  { key: 'security', label: 'Security', icon: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z' },
  { key: 'audit', label: 'Audit Log', icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z' },
  { key: 'danger', label: 'Danger Zone', icon: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z' },
];

/* ─── SectionCard ───────────────────────────────────────── */
function SCard({ title, description, icon, children }: { title: string; description?: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] shadow-[var(--shadow-card)]">
      <div className="flex items-start gap-3.5 border-b border-[var(--gogo-divider)] px-6 py-4">
        {icon && (
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-sm font-semibold text-[var(--gogo-text-primary)]">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-[var(--gogo-text-secondary)]">{description}</p>}
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

/* ─── Field helper ───────────────────────────────────────── */
function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-[var(--gogo-text-primary)]">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-[var(--gogo-text-secondary)]">{hint}</p>}
    </div>
  );
}

/* ─── Save footer ────────────────────────────────────────── */
function SaveFooter({ saving, dirty, onSave, onDiscard, hint }: { saving: boolean; dirty: boolean; onSave: () => void; onDiscard: () => void; hint?: string }) {
  if (!dirty) return null;
  return (
    <div className="mt-6 flex items-center justify-between border-t border-[var(--gogo-divider)] pt-5">
      <p className="text-xs text-[var(--gogo-text-secondary)]">{hint ?? 'You have unsaved changes.'}</p>
      <div className="flex items-center gap-2">
        <button
          onClick={onDiscard}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--gogo-divider)] px-4 py-2.5 text-sm font-semibold text-[var(--gogo-text-primary)] transition hover:bg-[var(--gogo-divider)] disabled:opacity-50"
        >
          Discard
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: 'var(--gogo-primary)' }}
        >
          {saving && (
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          Save Changes
        </button>
      </div>
    </div>
  );
}

/* ─── Types ──────────────────────────────────────── */
interface OrgData { name: string; slug: string; description: string }
interface SettingsData { general?: Record<string, string>; security?: Record<string, unknown>; notifications?: Record<string, unknown> }

/* ─── General Section ────────────────────────────── */
function GeneralSection({ org, setOrg, settings, setSettings, saving, dirty, onSave, onDiscard }: {
  org: OrgData; setOrg: (o: OrgData) => void;
  settings: SettingsData; setSettings: (s: SettingsData) => void;
  saving: boolean; dirty: boolean; onSave: () => void; onDiscard: () => void;
}) {
  const InfoIcon = <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" /></svg>;
  const GlobeIcon = <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>;

  return (
    <div className="space-y-5">
      <SCard title="Organization Information" description="Basic details and identity for your organization" icon={InfoIcon}>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Organization Name">
            <Input value={org.name} onChange={(e) => setOrg({ ...org, name: e.target.value })} placeholder="Acme Corp" />
          </Field>
          <Field label="Slug" hint="URL-friendly identifier — lowercase letters and hyphens only">
            <Input value={org.slug} onChange={(e) => setOrg({ ...org, slug: e.target.value })} placeholder="acme-corp" className="font-mono" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Description">
              <Textarea rows={3} value={org.description} onChange={(e) => setOrg({ ...org, description: e.target.value })} placeholder="Tell us about your organization…" />
            </Field>
          </div>
        </div>
        <SaveFooter saving={saving} dirty={dirty} onSave={onSave} onDiscard={onDiscard} />
      </SCard>

      <SCard title="Regional Settings" description="Localization and contact details for your organization" icon={GlobeIcon}>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Website">
            <Input value={settings.general?.website || ''} onChange={(e) => setSettings({ ...settings, general: { ...settings.general, website: e.target.value } })} placeholder="https://example.com" type="url" />
          </Field>
          <Field label="Industry">
            <Select value={settings.general?.industry || ''} onChange={(e) => setSettings({ ...settings, general: { ...settings.general, industry: e.target.value } })} options={[{ value: '', label: 'Select industry' }, { value: 'Technology', label: 'Technology' }, { value: 'Finance', label: 'Finance' }, { value: 'Healthcare', label: 'Healthcare' }, { value: 'Education', label: 'Education' }, { value: 'Manufacturing', label: 'Manufacturing' }, { value: 'Retail', label: 'Retail' }, { value: 'Other', label: 'Other' }]} />
          </Field>
          <Field label="Company Size">
            <Select value={settings.general?.size || ''} onChange={(e) => setSettings({ ...settings, general: { ...settings.general, size: e.target.value } })} options={[{ value: '', label: 'Select size' }, { value: '1-10', label: '1–10 employees' }, { value: '11-50', label: '11–50 employees' }, { value: '51-200', label: '51–200 employees' }, { value: '201-500', label: '201–500 employees' }, { value: '501-1000', label: '501–1000 employees' }, { value: '1000+', label: '1000+ employees' }]} />
          </Field>
          <Field label="Timezone">
            <Select value={settings.general?.timezone || 'UTC'} onChange={(e) => setSettings({ ...settings, general: { ...settings.general, timezone: e.target.value } })} options={[{ value: 'UTC', label: 'UTC' }, { value: 'America/New_York', label: 'Eastern Time (US)' }, { value: 'America/Chicago', label: 'Central Time (US)' }, { value: 'America/Denver', label: 'Mountain Time (US)' }, { value: 'America/Los_Angeles', label: 'Pacific Time (US)' }, { value: 'Europe/London', label: 'London (GMT)' }, { value: 'Europe/Berlin', label: 'Berlin (CET)' }, { value: 'Asia/Tokyo', label: 'Tokyo (JST)' }, { value: 'Asia/Kolkata', label: 'India (IST)' }, { value: 'Australia/Sydney', label: 'Sydney (AEST)' }]} />
          </Field>
        </div>
        <SaveFooter saving={saving} dirty={dirty} onSave={onSave} onDiscard={onDiscard} />
      </SCard>
    </div>
  );
}

/* ─── Branding Section ───────────────────────────── */
function BrandingSection({ orgId }: { orgId: string }) {
  const [branding, setBranding] = useState({ primaryColor: '#2563eb', secondaryColor: '#1e40af', accentColor: '#3b82f6', logoUrl: '' });
  const [saving, setSaving] = useState(false);
  const [logoBlobUrl, setLogoBlobUrl] = useState<string | null>(null);
  const originalBranding = useRef({ primaryColor: '#2563eb', secondaryColor: '#1e40af', accentColor: '#3b82f6', logoUrl: '' });
  const brandingDirty = JSON.stringify(branding) !== JSON.stringify(originalBranding.current);

  useEffect(() => {
    if (!orgId) return;
    authApi.getOrganizationBranding(orgId)
      .then((res: any) => {
        if (res.data?.data) {
          setBranding((prev) => {
            const loaded = { ...prev, ...res.data.data };
            originalBranding.current = { ...loaded };
            return loaded;
          });
        }
      })
      .catch(() => { });
  }, [orgId]);

  useEffect(() => {
    if (!branding.logoUrl) { setLogoBlobUrl(null); return; }
    const match = branding.logoUrl.match(/\/files\/([0-9a-f-]+)\/download/);
    if (!match) { setLogoBlobUrl(branding.logoUrl); return; }
    let revoked = false;
    filesApi.download(match[1]).then((url: string | null) => { if (!revoked) setLogoBlobUrl(url); }).catch(() => setLogoBlobUrl(null));
    return () => { revoked = true; };
  }, [branding.logoUrl]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await authApi.updateOrganizationBranding(orgId, branding);
      originalBranding.current = { ...branding };
    } catch { /* noop */ }
    setSaving(false);
  };

  const handleBrandingDiscard = () => {
    setBranding({ ...originalBranding.current });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('file', file);
      const uploadRes = await filesApi.upload(fd);
      const fileId = uploadRes.data?.data?.id;
      if (fileId) {
        const logoUrl = `/api/v1/files/${fileId}/download`;
        await authApi.updateOrganizationBranding(orgId, { logoUrl });
        setBranding({ ...branding, logoUrl });
        setLogoBlobUrl(URL.createObjectURL(file));
      }
    } catch { /* noop */ }
  };

  const PaletteIcon = <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" /></svg>;
  const PhotoIcon = <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V5.25a2.25 2.25 0 00-2.25-2.25H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>;

  return (
    <div className="space-y-5">
      <SCard title="Brand Colors" description="Customize the primary color palette for your organization" icon={PaletteIcon}>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {([['primaryColor', 'Primary Color'], ['secondaryColor', 'Secondary Color'], ['accentColor', 'Accent Color']] as const).map(([key, label]) => (
            <Field key={key} label={label}>
              <div className="flex items-center gap-2.5">
                <input
                  type="color"
                  value={branding[key]}
                  onChange={(e) => setBranding({ ...branding, [key]: e.target.value })}
                  className="h-10 w-10 cursor-pointer rounded-lg border border-[var(--gogo-divider)] p-0.5"
                />
                <Input value={branding[key]} onChange={(e) => setBranding({ ...branding, [key]: e.target.value })} maxLength={7} className="font-mono" />
              </div>
            </Field>
          ))}
        </div>
        <div className="mt-5 overflow-hidden rounded-lg border border-[var(--gogo-divider)]">
          <div className="flex">
            {(['primaryColor', 'secondaryColor', 'accentColor'] as const).map((key, i) => (
              <div key={key} className={`h-10 flex-1 ${i === 0 ? 'rounded-l-lg' : i === 2 ? 'rounded-r-lg' : ''}`} style={{ backgroundColor: branding[key] }} />
            ))}
          </div>
          <div className="flex border-t border-[var(--gogo-divider)]">
            {(['primaryColor', 'secondaryColor', 'accentColor'] as const).map((key) => (
              <p key={key} className="flex-1 py-1.5 text-center font-mono text-[10px] text-[var(--gogo-text-secondary)]">{branding[key]}</p>
            ))}
          </div>
        </div>
        <SaveFooter saving={saving} dirty={brandingDirty} onSave={handleSave} onDiscard={handleBrandingDiscard} hint="Colors apply across your organization's interface." />
      </SCard>

      <SCard title="Organization Logo" description="Displayed across the platform to identify your organization" icon={PhotoIcon}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[var(--gogo-divider)] bg-[var(--gogo-divider)]">
            {logoBlobUrl ? (
              <img src={logoBlobUrl} alt="Logo" className="h-full w-full object-contain p-2" />
            ) : (
              <svg className="h-10 w-10 text-[var(--gogo-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.25}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V5.25a2.25 2.25 0 00-2.25-2.25H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>
            )}
          </div>
          <div>
            <p className="mb-3 text-sm text-[var(--gogo-text-secondary)]">Upload a square image that represents your organization. It will appear in navigation and reports.</p>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] px-4 py-2 text-sm font-medium text-[var(--gogo-text-primary)] shadow-[var(--shadow-card)] transition hover:bg-[var(--gogo-divider)]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
              <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
              Upload Logo
            </label>
            <p className="mt-1.5 text-xs text-[var(--gogo-text-secondary)]">PNG, JPG, SVG — max 2 MB</p>
          </div>
        </div>
      </SCard>
    </div>
  );
}

/* ─── Security Section ───────────────────────────── */
function SecuritySection({ settings, setSettings, saving, dirty, onSave, onDiscard }: { settings: SettingsData; setSettings: (s: SettingsData) => void; saving: boolean; dirty: boolean; onSave: () => void; onDiscard: () => void }) {
  const security = (settings.security || {}) as Record<string, unknown>;
  const policy = (security.passwordPolicy || {}) as Record<string, unknown>;

  const update = (field: string, value: unknown) => { setSettings({ ...settings, security: { ...security, [field]: value } }); };
  const updatePolicy = (field: string, value: unknown) => { setSettings({ ...settings, security: { ...security, passwordPolicy: { ...policy, [field]: value } } }); };

  const ShieldIcon = <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>;
  const KeyIcon = <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>;
  const LockIcon = <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>;

  return (
    <div className="space-y-5">
      <SCard title="Authentication" description="Configure sign-in policies for all members" icon={ShieldIcon}>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-[var(--gogo-divider)] bg-[var(--gogo-divider)] px-4 py-3">
            <div>
              <p className="text-sm font-medium text-[var(--gogo-text-primary)]">Require two-factor authentication</p>
              <p className="mt-0.5 text-xs text-[var(--gogo-text-secondary)]">All members must enable 2FA to access the organization</p>
            </div>
            <Switch checked={!!security.enforceTwoFactor} onChange={(v) => update('enforceTwoFactor', v)} />
          </div>
          <Field label="Session Timeout (minutes)" hint="Members will be signed out after this period of inactivity">
            <Input type="number" value={String(Math.floor(((security.sessionTimeout as number) || 3600) / 60))} onChange={(e) => update('sessionTimeout', parseInt(e.target.value) * 60 || 3600)} min={5} max={1440} />
          </Field>
        </div>
        <SaveFooter saving={saving} dirty={dirty} onSave={onSave} onDiscard={onDiscard} />
      </SCard>

      <SCard title="Password Policy" description="Set minimum security requirements for member passwords" icon={KeyIcon}>
        <div className="space-y-4">
          <Field label="Minimum Password Length" hint="Recommended: 12 characters or more">
            <Input type="number" value={String((policy.minLength as number) || 8)} onChange={(e) => updatePolicy('minLength', parseInt(e.target.value) || 8)} min={6} max={128} />
          </Field>
          <div className="divide-y divide-[var(--gogo-divider)] overflow-hidden rounded-lg border border-[var(--gogo-divider)]">
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-sm text-[var(--gogo-text-primary)]">Require uppercase letters</p>
              <Switch checked={policy.requireUppercase !== false} onChange={(v) => updatePolicy('requireUppercase', v)} />
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-sm text-[var(--gogo-text-primary)]">Require numbers</p>
              <Switch checked={policy.requireNumbers !== false} onChange={(v) => updatePolicy('requireNumbers', v)} />
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-sm text-[var(--gogo-text-primary)]">Require special characters</p>
              <Switch checked={policy.requireSpecialChars !== false} onChange={(v) => updatePolicy('requireSpecialChars', v)} />
            </div>
          </div>
        </div>
        <SaveFooter saving={saving} dirty={dirty} onSave={onSave} onDiscard={onDiscard} />
      </SCard>

      <SCard title="IP Restrictions" description="Limit access to specific IP addresses or networks" icon={LockIcon}>
        <Field label="Allowed IP Addresses" hint="Enter comma-separated IPs or CIDR ranges (e.g. 192.168.1.0/24). Leave empty to allow all.">
          <Input value={((security.ipWhitelist as string[]) || []).join(', ')} onChange={(e) => update('ipWhitelist', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} placeholder="192.168.1.0/24, 10.0.0.1" className="font-mono" />
        </Field>
        <SaveFooter saving={saving} dirty={dirty} onSave={onSave} onDiscard={onDiscard} hint="Restrictions apply immediately to all subsequent sign-ins." />
      </SCard>
    </div>
  );
}

/* ─── Audit Log Section ─────────────────────────────────── */
function timeAgo(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

const AUDIT_CONFIG: Record<string, { color: string; label: string; iconPath: string }> = {
  update_profile: { color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', label: 'Updated profile', iconPath: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z' },
  update_organization: { color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', label: 'Updated organization', iconPath: 'M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z' },
  update_branding: { color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400', label: 'Updated branding', iconPath: 'M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z' },
  update_settings: { color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400', label: 'Updated settings', iconPath: 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  add_member: { color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', label: 'Added member', iconPath: 'M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z' },
  remove_member: { color: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400', label: 'Removed member', iconPath: 'M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z' },
  login: { color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', label: 'Signed in', iconPath: 'M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9' },
  change_password: { color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', label: 'Changed password', iconPath: 'M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z' },
  enable_2fa: { color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', label: 'Enabled 2FA', iconPath: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z' },
};

interface AuditEntry { id: string; action: string; description?: string; createdAt?: string; userName?: string; metadata?: { changes?: { field: string; previous: unknown; current: unknown }[] } }

function AuditSection({ orgId }: { orgId: string }) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) return;
    setLoading(true);
    authApi.getAuditLog(orgId, { page: 1, limit: 50 })
      .then((res: any) => { setEntries(res.data?.data?.entries || []); setTotal(res.data?.data?.total || 0); })
      .catch(() => { setEntries([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [orgId]);

  return (
    <div className="rounded-xl border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] shadow-[var(--shadow-card)]">
      <div className="flex items-start gap-3.5 border-b border-[var(--gogo-divider)] px-6 py-4">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: 'color-mix(in srgb, var(--gogo-primary) 10%, transparent)', color: 'var(--gogo-primary)' }}>
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--gogo-text-primary)]">Recent Activity</h3>
          <p className="mt-0.5 text-xs text-[var(--gogo-text-secondary)]">{total > 0 ? `Latest ${entries.length} of ${total} events` : 'All activity for your organization'}</p>
        </div>
      </div>
      <div className="px-6 py-5">
        {loading ? (
          <div className="flex items-center justify-center py-16"><div className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: 'var(--gogo-primary)', borderTopColor: 'transparent' }} /></div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--gogo-divider)]">
              <svg className="h-7 w-7 text-[var(--gogo-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="mt-3 text-sm font-medium text-[var(--gogo-text-primary)]">No activity yet</p>
            <p className="mt-1 text-xs text-[var(--gogo-text-secondary)]">Events will appear here as you make changes</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--gogo-divider)]">
            {entries.map((entry) => {
              const config = AUDIT_CONFIG[entry.action] || { color: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400', label: entry.action, iconPath: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z' };
              const isExpanded = expandedId === entry.id;
              const hasChanges = (entry.metadata?.changes?.length || 0) > 0;
              return (
                <div key={entry.id}>
                  <button type="button" onClick={() => hasChanges && setExpandedId(isExpanded ? null : entry.id)} className={`flex w-full items-center gap-4 py-3.5 text-left transition-colors ${hasChanges ? 'cursor-pointer hover:bg-[var(--gogo-divider)]' : 'cursor-default'} -mx-6 px-6`}>
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${config.color}`}>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d={config.iconPath} /></svg>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--gogo-text-primary)]">{entry.description || config.label}</p>
                      <p className="mt-0.5 text-xs text-[var(--gogo-text-secondary)]">{entry.createdAt ? timeAgo(entry.createdAt) : '—'}{entry.userName && entry.userName !== 'System' ? ` · ${entry.userName}` : ''}</p>
                    </div>
                    {hasChanges && (
                      <svg className={`h-4 w-4 shrink-0 text-[var(--gogo-text-secondary)] transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                    )}
                  </button>
                  {isExpanded && hasChanges && (
                    <div className="mb-3 space-y-2 pl-[52px]">
                      {entry.metadata!.changes!.map((change, i) => (
                        <div key={i} className="overflow-hidden rounded-lg border border-[var(--gogo-divider)]">
                          <div className="bg-[var(--gogo-divider)] px-3 py-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--gogo-text-secondary)]">{change.field}</span>
                          </div>
                          <div className="grid grid-cols-2 divide-x divide-[var(--gogo-divider)]">
                            <div className="px-3 py-2">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-red-400">Before</span>
                              <p className="mt-0.5 break-all text-xs text-red-600 dark:text-red-400">
                                {change.previous == null || change.previous === '' ? <em className="text-[var(--gogo-text-secondary)]">empty</em> : String(change.previous)}
                              </p>
                            </div>
                            <div className="px-3 py-2">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500">After</span>
                              <p className="mt-0.5 break-all text-xs text-emerald-600 dark:text-emerald-400">
                                {change.current == null || change.current === '' ? <em className="text-[var(--gogo-text-secondary)]">empty</em> : String(change.current)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {total > entries.length && (
          <p className="mt-4 text-center text-xs text-[var(--gogo-text-secondary)]">Showing {entries.length} of {total} events</p>
        )}
      </div>
    </div>
  );
}

/* ─── Danger Zone Section ───────────────────────────────── */
function DangerSection({ orgId, orgName }: { orgId: string; orgName: string }) {
  const [transferEmail, setTransferEmail] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const handleTransfer = async () => {
    if (!transferEmail) return;
    if (!confirm(`Transfer ownership to ${transferEmail}? This action cannot be undone.`)) return;
    try { await authApi.transferOwnership(orgId, { newOwnerId: transferEmail }); } catch { /* demo */ }
  };

  const handleDelete = async () => {
    if (deleteConfirm !== orgName) return;
    if (!confirm(`Permanently delete "${orgName}"? This cannot be undone.`)) return;
    try { await authApi.deleteOrganization(orgId); } catch { /* demo */ }
  };

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-xl border-2 border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-3.5 border-b border-amber-200 bg-amber-50 px-6 py-4 dark:border-amber-800 dark:bg-amber-950/40">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400">
            <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">Transfer Ownership</h3>
            <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-500">Transfer this organization to another user. You will lose admin privileges.</p>
          </div>
        </div>
        <div className="bg-amber-50/50 px-6 py-5 dark:bg-amber-950/20">
          <div className="flex gap-3">
            <Input value={transferEmail} onChange={(e) => setTransferEmail(e.target.value)} placeholder="Enter user email or ID" />
            <button onClick={handleTransfer} disabled={!transferEmail} className="shrink-0 rounded-lg border border-amber-400 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              Transfer
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border-2 border-red-200 dark:border-red-800">
        <div className="flex items-start gap-3.5 border-b border-red-200 bg-red-50 px-6 py-4 dark:border-red-800 dark:bg-red-950/40">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400">
            <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">Delete Organization</h3>
            <p className="mt-0.5 text-xs text-red-600 dark:text-red-500">Permanently delete this organization and all associated data. This action is irreversible.</p>
          </div>
        </div>
        <div className="bg-red-50/50 px-6 py-5 dark:bg-red-950/20">
          <Field label={`Type "${orgName}" to confirm deletion`}>
            <Input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder={orgName} />
          </Field>
          <div className="mt-4">
            <button onClick={handleDelete} disabled={deleteConfirm !== orgName} className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40">
              Permanently Delete Organization
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────── */
export default function OrganizationSettingsPage() {
  const [activeSection, setActiveSection] = useState('general');
  const [mobileSectionOpen, setMobileSectionOpen] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [org, setOrg] = useState<OrgData>({ name: '', slug: '', description: '' });
  const [settings, setSettings] = useState<SettingsData>({ general: {}, security: {}, notifications: {} });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const originalOrg = useRef<OrgData>({ name: '', slug: '', description: '' });
  const originalSettings = useRef<SettingsData>({ general: {}, security: {}, notifications: {} });
  const isDirty = JSON.stringify(org) !== JSON.stringify(originalOrg.current) ||
    JSON.stringify(settings) !== JSON.stringify(originalSettings.current);

  useEffect(() => {
    const storedOrgId = localStorage.getItem('organizationId');

    async function load() {
      try {
        const myOrgsRes = await authApi.myOrganizations();
        const orgs = myOrgsRes.data?.data || [];
        const currentId = storedOrgId || orgs[0]?.organizationId;

        if (currentId) {
          setOrgId(currentId);
          const [orgRes, settingsRes] = await Promise.all([
            authApi.getOrganization(currentId),
            authApi.getOrganizationSettings(currentId),
          ]);
          const orgData = orgRes.data?.data || {};
          const loadedOrg = { name: orgData.name || '', slug: orgData.slug || '', description: orgData.description || '' };
          const loadedSettings: SettingsData = settingsRes.data?.data || { general: {}, security: {}, notifications: {} };
          setOrg(loadedOrg);
          setSettings(loadedSettings);
          originalOrg.current = JSON.parse(JSON.stringify(loadedOrg));
          originalSettings.current = JSON.parse(JSON.stringify(loadedSettings));
        }
      } catch {
        const fallbackOrg = { name: 'Acme Corporation', slug: 'acme-corp', description: 'A multi-product technology company.' };
        const fallbackSettings: SettingsData = { general: { website: 'https://acme.com', industry: 'Technology', size: '51-200', timezone: 'America/New_York' }, security: { enforceTwoFactor: false, sessionTimeout: 3600, ipWhitelist: [], passwordPolicy: { minLength: 8, requireUppercase: true, requireNumbers: true, requireSpecialChars: false } }, notifications: { emailNotifications: true } };
        setOrg(fallbackOrg);
        setSettings(fallbackSettings);
        originalOrg.current = JSON.parse(JSON.stringify(fallbackOrg));
        originalSettings.current = JSON.parse(JSON.stringify(fallbackSettings));
        setOrgId('demo');
      }
      setLoading(false);
    }

    load();
  }, []);

  const handleSave = async () => {
    if (!orgId) return;
    setSaving(true);
    try {
      await Promise.all([
        authApi.updateOrganization(orgId, org as unknown as Record<string, unknown>),
        authApi.updateOrganizationSettings(orgId, settings as unknown as Record<string, unknown>),
      ]);
      originalOrg.current = JSON.parse(JSON.stringify(org));
      originalSettings.current = JSON.parse(JSON.stringify(settings));
    } catch { /* demo mode */ }
    setSaving(false);
  };

  const handleDiscard = () => {
    setOrg(JSON.parse(JSON.stringify(originalOrg.current)));
    setSettings(JSON.parse(JSON.stringify(originalSettings.current)));
  };

  if (loading) {
    return <OrgSettingsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="mb-1 flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--gogo-text-secondary)' }}>
          <span>Settings</span>
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          <span style={{ color: 'var(--gogo-primary)', fontWeight: 600 }}>Organization</span>
        </div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--gogo-text-primary)', fontFamily: 'var(--font-gogo)' }}>Organization Settings</h1>
        <p className="mt-0.5 text-sm" style={{ color: 'var(--gogo-text-secondary)' }}>{org.name ? `Manage settings for ${org.name}` : 'Manage your organization details'}</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">

        {/* Desktop sidebar */}
        <aside className="sticky hidden h-fit w-56 shrink-0 overflow-y-auto lg:block" style={{ top: 'calc(var(--gogo-header-height) + 1.5rem)', backgroundColor: 'var(--gogo-surface)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--gogo-divider)', padding: '12px' }}>
          <nav className="space-y-0.5">
            {SECTIONS.map((section) => {
              const isActive = activeSection === section.key;
              const isDanger = section.key === 'danger';
              return (
                <button
                  key={section.key}
                  onClick={() => setActiveSection(section.key)}
                  className="relative flex w-full items-center gap-3 rounded-[var(--radius-button)] px-3 py-2.5 text-left text-sm transition-all"
                  style={{
                    backgroundColor: isActive ? 'color-mix(in srgb, var(--gogo-primary) 10%, transparent)' : 'transparent',
                    color: isActive ? 'var(--gogo-primary)' : isDanger ? '#dc2626' : 'var(--gogo-text-secondary)',
                    fontWeight: isActive ? 600 : 500,
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'var(--gogo-grey-100)'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full" style={{ width: 3, height: '60%', backgroundColor: 'var(--gogo-primary)' }} />
                  )}
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-chip)]"
                    style={{ backgroundColor: isActive ? 'color-mix(in srgb, var(--gogo-primary) 15%, transparent)' : 'var(--gogo-grey-100)' }}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={section.icon} />
                    </svg>
                  </span>
                  <span className="flex-1">{section.label}</span>
                  {isDanger && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Mobile section picker */}
        <div className="relative w-full lg:hidden">
          {(() => {
            const active = SECTIONS.find((i) => i.key === activeSection);
            return (
              <>
                <button
                  onClick={() => setMobileSectionOpen((o) => !o)}
                  className="flex w-full items-center justify-between rounded-xl border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] px-4 py-3 text-left shadow-[var(--shadow-card)] transition hover:bg-[var(--gogo-divider)]"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-chip)]" style={{ backgroundColor: 'color-mix(in srgb, var(--gogo-primary) 10%, transparent)', color: 'var(--gogo-primary)' }}>
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d={active?.icon} /></svg>
                    </span>
                    <span className="text-sm font-medium text-[var(--gogo-text-primary)]">{active?.label}</span>
                  </span>
                  <svg className={`h-4 w-4 text-[var(--gogo-text-secondary)] transition-transform ${mobileSectionOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                </button>
                {mobileSectionOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setMobileSectionOpen(false)} />
                    <div className="absolute left-0 right-0 top-full z-40 mt-1 overflow-hidden rounded-xl border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] shadow-xl">
                      {SECTIONS.map((item) => (
                        <button
                          key={item.key}
                          onClick={() => { setActiveSection(item.key); setMobileSectionOpen(false); }}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium transition"
                          style={{ color: activeSection === item.key ? 'var(--gogo-primary)' : 'var(--gogo-text-secondary)', backgroundColor: activeSection === item.key ? 'color-mix(in srgb, var(--gogo-primary) 8%, transparent)' : undefined }}
                        >
                          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d={item.icon} /></svg>
                          {item.label}
                          {item.key === 'danger' && <span className="ml-auto h-2 w-2 rounded-full bg-red-500" />}
                          {activeSection === item.key && <svg className="ml-auto h-4 w-4 shrink-0" style={{ color: 'var(--gogo-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            );
          })()}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {activeSection === 'general' && <GeneralSection org={org} setOrg={setOrg} settings={settings} setSettings={setSettings} saving={saving} dirty={isDirty} onSave={handleSave} onDiscard={handleDiscard} />}
          {activeSection === 'branding' && orgId && <BrandingSection orgId={orgId} />}
          {activeSection === 'security' && <SecuritySection settings={settings} setSettings={setSettings} saving={saving} dirty={isDirty} onSave={handleSave} onDiscard={handleDiscard} />}
          {activeSection === 'audit' && orgId && <AuditSection orgId={orgId} />}
          {activeSection === 'danger' && orgId && <DangerSection orgId={orgId} orgName={org.name} />}
        </div>
      </div>
    </div>
  );
}
