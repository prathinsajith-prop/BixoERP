'use client';

import { useState, useEffect, type ReactNode } from 'react';
import PageHeader from '@/components/page-header';
import { authApi } from '@/lib/api/auth';
import { filesApi } from '@/lib/api/files';


const SECTIONS = [
  { key: 'general', label: 'General', icon: 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  { key: 'branding', label: 'Branding', icon: 'M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42' },
  { key: 'security', label: 'Security', icon: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z' },
  { key: 'audit', label: 'Audit Log', icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z' },
  { key: 'danger', label: 'Danger Zone', icon: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z' },
];

/* ─── Shared helpers ────────────────────────────────────── */
function SectionCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
        {description && <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function TextInput({ value, onChange, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <input
      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      value={value}
      onChange={onChange}
      {...props}
    />
  );
}

function SelectInput({ value, onChange, options, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: { value: string; label: string }[] }) {
  return (
    <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white" value={value} onChange={onChange} {...props}>
      {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'}`}>
        <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
    </label>
  );
}

/* ─── General Settings ──────────────────────────────────── */
interface OrgData { name: string; slug: string; description: string }
interface SettingsData { general?: Record<string, string>; security?: Record<string, unknown>; notifications?: Record<string, unknown> }

function GeneralSection({ org, setOrg, settings, setSettings, saving, onSave }: { org: OrgData; setOrg: (o: OrgData) => void; settings: SettingsData; setSettings: (s: SettingsData) => void; saving: boolean; onSave: () => void }) {
  return (
    <div className="space-y-6">
      <SectionCard title="Organization Information" description="Basic details about your organization">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Organization Name">
            <TextInput value={org.name} onChange={(e) => setOrg({ ...org, name: e.target.value })} placeholder="Acme Corp" />
          </Field>
          <Field label="Slug" hint="URL-friendly identifier">
            <TextInput value={org.slug} onChange={(e) => setOrg({ ...org, slug: e.target.value })} placeholder="acme-corp" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Description">
              <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white" rows={3} value={org.description} onChange={(e) => setOrg({ ...org, description: e.target.value })} placeholder="Tell us about your organization..." />
            </Field>
          </div>
          <Field label="Website">
            <TextInput value={settings.general?.website || ''} onChange={(e) => setSettings({ ...settings, general: { ...settings.general, website: e.target.value } })} placeholder="https://example.com" type="url" />
          </Field>
          <Field label="Industry">
            <SelectInput value={settings.general?.industry || ''} onChange={(e) => setSettings({ ...settings, general: { ...settings.general, industry: e.target.value } })} options={[{ value: '', label: 'Select industry' }, { value: 'Technology', label: 'Technology' }, { value: 'Finance', label: 'Finance' }, { value: 'Healthcare', label: 'Healthcare' }, { value: 'Education', label: 'Education' }, { value: 'Manufacturing', label: 'Manufacturing' }, { value: 'Retail', label: 'Retail' }, { value: 'Other', label: 'Other' }]} />
          </Field>
          <Field label="Company Size">
            <SelectInput value={settings.general?.size || ''} onChange={(e) => setSettings({ ...settings, general: { ...settings.general, size: e.target.value } })} options={[{ value: '', label: 'Select size' }, { value: '1-10', label: '1-10 employees' }, { value: '11-50', label: '11-50 employees' }, { value: '51-200', label: '51-200 employees' }, { value: '201-500', label: '201-500 employees' }, { value: '501-1000', label: '501-1000 employees' }, { value: '1000+', label: '1000+ employees' }]} />
          </Field>
          <Field label="Timezone">
            <SelectInput value={settings.general?.timezone || 'UTC'} onChange={(e) => setSettings({ ...settings, general: { ...settings.general, timezone: e.target.value } })} options={[{ value: 'UTC', label: 'UTC' }, { value: 'America/New_York', label: 'Eastern Time (US)' }, { value: 'America/Chicago', label: 'Central Time (US)' }, { value: 'America/Denver', label: 'Mountain Time (US)' }, { value: 'America/Los_Angeles', label: 'Pacific Time (US)' }, { value: 'Europe/London', label: 'London (GMT)' }, { value: 'Europe/Berlin', label: 'Berlin (CET)' }, { value: 'Asia/Tokyo', label: 'Tokyo (JST)' }, { value: 'Asia/Kolkata', label: 'India (IST)' }, { value: 'Australia/Sydney', label: 'Sydney (AEST)' }]} />
          </Field>
        </div>
        <div className="mt-5 flex justify-end">
          <button onClick={onSave} disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </SectionCard>
    </div>
  );
}

/* ─── Branding Section ──────────────────────────────────── */
function BrandingSection({ orgId }: { orgId: string }) {
  const [branding, setBranding] = useState({ primaryColor: '#2563eb', secondaryColor: '#1e40af', accentColor: '#3b82f6', logoUrl: '' });
  const [saving, setSaving] = useState(false);
  const [logoBlobUrl, setLogoBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) return;
    authApi.getOrganizationBranding(orgId)
      .then((res) => res.data?.data && setBranding((prev) => ({ ...prev, ...res.data.data })))
      .catch(() => {});
  }, [orgId]);

  useEffect(() => {
    if (!branding.logoUrl) { setLogoBlobUrl(null); return; }
    const match = branding.logoUrl.match(/\/files\/([0-9a-f-]+)\/download/);
    if (!match) { setLogoBlobUrl(branding.logoUrl); return; }
    let revoked = false;
    filesApi.download(match[1]).then((url) => { if (!revoked) setLogoBlobUrl(url); }).catch(() => setLogoBlobUrl(null));
    return () => { revoked = true; };
  }, [branding.logoUrl]);

  const handleSave = async () => {
    setSaving(true);
    try { await authApi.updateOrganizationBranding(orgId, branding); } catch { /* noop */ }
    setSaving(false);
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

  return (
    <div className="space-y-6">
      <SectionCard title="Brand Colors" description="Customize the look and feel of your organization">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {([['primaryColor', 'Primary Color'], ['secondaryColor', 'Secondary Color'], ['accentColor', 'Accent Color']] as const).map(([key, label]) => (
            <Field key={key} label={label}>
              <div className="flex items-center gap-2">
                <input type="color" value={branding[key]} onChange={(e) => setBranding({ ...branding, [key]: e.target.value })} className="h-10 w-10 cursor-pointer rounded-lg border border-gray-300 dark:border-gray-600" />
                <TextInput value={branding[key]} onChange={(e) => setBranding({ ...branding, [key]: e.target.value })} maxLength={7} />
              </div>
            </Field>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          {['primaryColor', 'secondaryColor', 'accentColor'].map((key) => (
            <div key={key} className="h-12 flex-1 rounded-lg" style={{ backgroundColor: branding[key as keyof typeof branding] }} />
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Logo" description="Upload your organization logo">
        <div className="flex items-center gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-700">
            {logoBlobUrl ? (
              <img src={logoBlobUrl} alt="Logo" className="h-16 w-16 object-contain" />
            ) : (
              <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V5.25a2.25 2.25 0 00-2.25-2.25H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>
            )}
          </div>
          <div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
              <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
              Upload Logo
            </label>
            <p className="mt-1 text-xs text-gray-400">PNG, JPG, SVG. Max 2MB.</p>
          </div>
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save Branding'}</button>
      </div>
    </div>
  );
}

/* ─── Security Section ──────────────────────────────────── */
function SecuritySection({ settings, setSettings, saving, onSave }: { settings: SettingsData; setSettings: (s: SettingsData) => void; saving: boolean; onSave: () => void }) {
  const security = (settings.security || {}) as Record<string, unknown>;
  const policy = (security.passwordPolicy || {}) as Record<string, unknown>;

  const update = (field: string, value: unknown) => { setSettings({ ...settings, security: { ...security, [field]: value } }); };
  const updatePolicy = (field: string, value: unknown) => { setSettings({ ...settings, security: { ...security, passwordPolicy: { ...policy, [field]: value } } }); };

  return (
    <div className="space-y-6">
      <SectionCard title="Authentication" description="Configure authentication policies for your organization">
        <div className="space-y-4">
          <Toggle checked={!!security.enforceTwoFactor} onChange={(v) => update('enforceTwoFactor', v)} label="Require two-factor authentication for all members" />
          <Field label="Session Timeout (minutes)">
            <TextInput type="number" value={String(Math.floor(((security.sessionTimeout as number) || 3600) / 60))} onChange={(e) => update('sessionTimeout', parseInt(e.target.value) * 60 || 3600)} min={5} max={1440} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Password Policy" description="Set minimum requirements for user passwords">
        <div className="space-y-4">
          <Field label="Minimum Password Length">
            <TextInput type="number" value={String((policy.minLength as number) || 8)} onChange={(e) => updatePolicy('minLength', parseInt(e.target.value) || 8)} min={6} max={128} />
          </Field>
          <Toggle checked={policy.requireUppercase !== false} onChange={(v) => updatePolicy('requireUppercase', v)} label="Require uppercase letters" />
          <Toggle checked={policy.requireNumbers !== false} onChange={(v) => updatePolicy('requireNumbers', v)} label="Require numbers" />
          <Toggle checked={policy.requireSpecialChars !== false} onChange={(v) => updatePolicy('requireSpecialChars', v)} label="Require special characters" />
        </div>
      </SectionCard>

      <SectionCard title="IP Whitelist" description="Restrict access to specific IP addresses">
        <Field label="Allowed IPs" hint="Comma-separated IP addresses or CIDR ranges. Leave empty to allow all.">
          <TextInput value={((security.ipWhitelist as string[]) || []).join(', ')} onChange={(e) => update('ipWhitelist', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} placeholder="192.168.1.0/24, 10.0.0.1" />
        </Field>
      </SectionCard>

      <div className="flex justify-end">
        <button onClick={onSave} disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save Security Settings'}</button>
      </div>
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

const AUDIT_CONFIG: Record<string, { color: string; label: string }> = {
  update_profile: { color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', label: 'Updated profile' },
  update_organization: { color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', label: 'Updated org' },
  update_branding: { color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400', label: 'Updated branding' },
  update_settings: { color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', label: 'Updated settings' },
  add_member: { color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', label: 'Added member' },
  remove_member: { color: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400', label: 'Removed member' },
  login: { color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', label: 'Logged in' },
  change_password: { color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', label: 'Changed password' },
  enable_2fa: { color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', label: 'Enabled 2FA' },
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
      .then((res) => { setEntries(res.data?.data?.entries || []); setTotal(res.data?.data?.total || 0); })
      .catch(() => { setEntries([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [orgId]);

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Your latest actions and change history.</p>
      </div>
      <div>
        {loading ? (
          <div className="flex items-center justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /></div>
        ) : entries.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">No activity recorded yet</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {entries.map((entry) => {
              const config = AUDIT_CONFIG[entry.action] || { color: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400', label: entry.action };
              const isExpanded = expandedId === entry.id;
              const hasChanges = (entry.metadata?.changes?.length || 0) > 0;
              return (
                <div key={entry.id}>
                  <button type="button" onClick={() => setExpandedId(isExpanded ? null : entry.id)} className={`flex w-full items-center gap-4 py-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${hasChanges ? 'cursor-pointer' : 'cursor-default'}`}>
                    <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${config.color}`}>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{entry.description || config.label}</p>
                      <p className="mt-0.5 text-xs text-gray-400">{entry.createdAt ? timeAgo(entry.createdAt) : '—'}{entry.userName && entry.userName !== 'System' ? ` · ${entry.userName}` : ''}</p>
                    </div>
                    {hasChanges && (
                      <svg className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                    )}
                  </button>
                  {isExpanded && hasChanges && (
                    <div className="pb-4 pl-14 pr-4 space-y-2">
                      {entry.metadata!.changes!.map((change, i) => (
                        <div key={i} className="rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-900/50">
                          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{change.field}</span>
                          <div className="mt-1.5 grid grid-cols-2 gap-3">
                            <div>
                              <span className="text-[10px] font-medium uppercase tracking-wider text-red-400">Previous</span>
                              <div className="mt-0.5 rounded bg-red-50 px-2 py-1 text-sm text-red-700 break-all dark:bg-red-900/30 dark:text-red-400">{change.previous === null || change.previous === undefined || change.previous === '' ? <span className="italic text-gray-400">empty</span> : String(change.previous)}</div>
                            </div>
                            <div>
                              <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-500">New</span>
                              <div className="mt-0.5 rounded bg-emerald-50 px-2 py-1 text-sm text-emerald-700 break-all dark:bg-emerald-900/30 dark:text-emerald-400">{change.current === null || change.current === undefined || change.current === '' ? <span className="italic text-gray-400">empty</span> : String(change.current)}</div>
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
          <div className="border-t border-gray-100 py-3 text-center dark:border-gray-700"><span className="text-xs text-gray-400">Showing {entries.length} of {total} events</span></div>
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
    <div className="space-y-6">
      <div className="rounded-xl border-2 border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30">
        <div className="border-b border-amber-200 px-6 py-4 dark:border-amber-800">
          <h3 className="text-base font-semibold text-amber-800 dark:text-amber-400">Transfer Ownership</h3>
          <p className="mt-0.5 text-sm text-amber-600 dark:text-amber-500">Transfer this organization to another user. You will lose admin access.</p>
        </div>
        <div className="px-6 py-5">
          <div className="flex gap-3">
            <TextInput value={transferEmail} onChange={(e) => setTransferEmail(e.target.value)} placeholder="Enter user ID or email" />
            <button onClick={handleTransfer} disabled={!transferEmail} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700 disabled:opacity-50">Transfer</button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border-2 border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/30">
        <div className="border-b border-red-200 px-6 py-4 dark:border-red-800">
          <h3 className="text-base font-semibold text-red-800 dark:text-red-400">Delete Organization</h3>
          <p className="mt-0.5 text-sm text-red-600 dark:text-red-500">Permanently delete this organization and all its data. This action is irreversible.</p>
        </div>
        <div className="px-6 py-5">
          <Field label={`Type "${orgName}" to confirm`}>
            <TextInput value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder={orgName} />
          </Field>
          <div className="mt-3">
            <button onClick={handleDelete} disabled={deleteConfirm !== orgName} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50">Permanently Delete Organization</button>
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
          setOrg({ name: orgData.name || '', slug: orgData.slug || '', description: orgData.description || '' });
          setSettings(settingsRes.data?.data || { general: {}, security: {}, notifications: {} });
        }
      } catch {
        setOrg({ name: 'Acme Corporation', slug: 'acme-corp', description: 'A multi-product technology company.' });
        setSettings({ general: { website: 'https://acme.com', industry: 'Technology', size: '51-200', timezone: 'America/New_York' }, security: { enforceTwoFactor: false, sessionTimeout: 3600, ipWhitelist: [], passwordPolicy: { minLength: 8, requireUppercase: true, requireNumbers: true, requireSpecialChars: false } }, notifications: { emailNotifications: true } });
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
    } catch { /* demo mode */ }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /></div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Organization Settings" subtitle="Manage your organization details" />

        <div className="flex flex-col lg:flex-row lg:gap-0">
      <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 overflow-y-auto py-6 pr-4 lg:block">
        <nav className="space-y-1">
          {SECTIONS.map((section) => (
            <button key={section.key} onClick={() => setActiveSection(section.key)} className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition ${activeSection === section.key ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'}`}>
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={section.icon} /></svg>
              {section.label}
              {section.key === 'danger' && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-red-500" />}
            </button>
          ))}
        </nav>
      </aside>

      <div className="relative mb-4 w-full lg:hidden">
        {(() => {
          const active = SECTIONS.find((i) => i.key === activeSection);
          return (
            <>
              <button
                onClick={() => setMobileSectionOpen((o) => !o)}
                className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600"
              >
                <span className="flex items-center gap-2.5">
                  <svg className="h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={active?.icon} /></svg>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{active?.label}</span>
                </span>
                <svg className={`h-4 w-4 text-gray-400 transition-transform ${mobileSectionOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
              </button>
              {mobileSectionOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setMobileSectionOpen(false)} />
                  <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-80 overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-gray-900">
                    {SECTIONS.map((item) => (
                      <button
                        key={item.key}
                        onClick={() => { setActiveSection(item.key); setMobileSectionOpen(false); }}
                        className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition ${activeSection === item.key ? 'bg-blue-50 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'}`}
                      >
                        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={item.icon} /></svg>
                        {item.label}
                        {item.key === 'danger' && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-red-500" />}
                        {activeSection === item.key && <svg className="ml-auto h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          );
        })()}
      </div>

          <div className="min-w-0 flex-1">
        <div className="space-y-6">
            {activeSection === 'general' && <GeneralSection org={org} setOrg={setOrg} settings={settings} setSettings={setSettings} saving={saving} onSave={handleSave} />}
            {activeSection === 'branding' && orgId && <BrandingSection orgId={orgId} />}
            {activeSection === 'security' && <SecuritySection settings={settings} setSettings={setSettings} saving={saving} onSave={handleSave} />}
            {activeSection === 'audit' && orgId && <AuditSection orgId={orgId} />}
            {activeSection === 'danger' && orgId && <DangerSection orgId={orgId} orgName={org.name} />}
        </div>
          </div>
        </div>
      </div>
  );
}
