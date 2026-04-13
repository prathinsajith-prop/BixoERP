'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { showToast } from '@erp/shell';
import PageHeader from '@/components/page-header';
import { Input, Textarea } from '@erp/ui';

const PRESETS = [
  { id: 'starter' as const, label: 'Starter', description: 'Workflow, Notifications, Files, Audit — essentials for any team.' },
  { id: 'standard' as const, label: 'Standard', description: 'Starter + HR, Finance, AP/AR, Reports — for growing businesses.', recommended: true },
  { id: 'full' as const, label: 'Full', description: 'All registered modules — complete ERP suite.' },
];

export default function NewOrganizationPage() {
  const router = useRouter();

  // Step 1 state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [slugManual, setSlugManual] = useState(false);

  // Step 2 state
  const [step, setStep] = useState<1 | 2>(1);
  const [createdOrgId, setCreatedOrgId] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<'starter' | 'standard' | 'full'>('standard');
  const [applying, setApplying] = useState(false);

  const autoSlug = (n: string) => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleNameChange = (v: string) => {
    setName(v);
    if (!slugManual) setSlug(autoSlug(v));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;
    setSaving(true);
    try {
      const res = await authApi.createOrganization({ name: name.trim(), slug: slug.trim(), description: description.trim() });
      const created = res.data?.data ?? res.data;
      setCreatedOrgId(created?.id ?? '');
      showToast.success('Organization created', `"${name}" has been created.`);
      setStep(2);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast.error('Create failed', msg || 'Could not create organization.');
    } finally {
      setSaving(false);
    }
  };

  const handleApplyPreset = async () => {
    if (!createdOrgId) return;
    setApplying(true);
    try {
      await authApi.applyModulePreset(createdOrgId, { preset: selectedPreset });
      showToast.success('Modules configured', `${PRESETS.find(p => p.id === selectedPreset)?.label} preset applied.`);
      router.push(`/admin/organizations/${createdOrgId}`);
    } catch {
      showToast.error('Preset failed', 'Could not apply module preset. You can configure modules later.');
      router.push(`/admin/organizations/${createdOrgId}`);
    } finally {
      setApplying(false);
    }
  };

  const handleSkip = () => {
    router.push(`/admin/organizations/${createdOrgId}`);
  };

  /* ── Stepper indicator ── */
  const StepIndicator = () => (
    <div className="flex items-center gap-3 mb-6">
      {[1, 2].map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${step >= s ? 'text-white' : 'text-[var(--gogo-text-secondary)] bg-[var(--gogo-surface-raised)] border border-[var(--gogo-divider)]'}`} style={step >= s ? { backgroundColor: 'var(--gogo-primary)' } : {}}>
            {step > s ? <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> : s}
          </div>
          <span className={`text-xs font-medium ${step === s ? '' : 'text-[var(--gogo-text-secondary)]'}`} style={step === s ? { color: 'var(--gogo-text-primary)' } : {}}>{s === 1 ? 'Organization info' : 'Module preset'}</span>
          {s < 2 && <div className="h-px w-8 bg-[var(--gogo-divider)]" />}
        </div>
      ))}
    </div>
  );

  /* ── Step 1 ── */
  if (step === 1) return (
    <div className="space-y-6">
      <PageHeader
        title="New Organization"
        subtitle="Create a new organization in the system"
        action={
          <button type="button" onClick={() => router.push('/admin/organizations')} className="rounded-lg border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] px-4 py-2 text-sm font-medium text-[var(--gogo-text-secondary)] shadow-[var(--shadow-card)] transition hover:bg-[var(--gogo-divider)] hover:text-[var(--gogo-text-primary)]">
            Cancel
          </button>
        }
      />
      <StepIndicator />
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="overflow-hidden rounded-xl border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-3 border-b border-[var(--gogo-divider)] px-6 py-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: 'color-mix(in srgb, var(--gogo-primary) 10%, transparent)', color: 'var(--gogo-primary)' }}>
              <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" /></svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--gogo-text-primary)]">Organization Details</h3>
              <p className="mt-0.5 text-xs text-[var(--gogo-text-secondary)]">Basic information about the new organization</p>
            </div>
          </div>
          <div className="space-y-5 px-6 py-5">
            <Input label="Name" type="text" value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Acme Corp" required />
            <div>
              <Input label="Slug" type="text" value={slug} onChange={(e) => { setSlugManual(true); setSlug(e.target.value); }} placeholder="acme-corp" required pattern="[a-z0-9]+(-[a-z0-9]+)*" title="Lowercase letters, numbers and hyphens only" className="font-mono" />
              <p className="mt-1 text-xs text-[var(--gogo-text-secondary)]">URL-friendly identifier — lowercase letters, numbers and hyphens only.</p>
            </div>
            <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A short description of the organization" rows={3} maxLength={500} />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.push('/admin/organizations')} className="rounded-lg border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] px-4 py-2.5 text-sm font-medium text-[var(--gogo-text-secondary)] shadow-[var(--shadow-card)] transition hover:bg-[var(--gogo-divider)] hover:text-[var(--gogo-text-primary)]">Cancel</button>
          <button type="submit" disabled={saving || !name.trim() || !slug.trim()} className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50" style={{ backgroundColor: 'var(--gogo-primary)' }}>
            {saving && <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
            {saving ? 'Creating…' : 'Continue →'}
          </button>
        </div>
      </form>
    </div>
  );

  /* ── Step 2 ── */
  return (
    <div className="space-y-6">
      <PageHeader
        title="Configure Modules"
        subtitle={`Choose a module preset for "${name}"`}
      />
      <StepIndicator />
      <div className="overflow-hidden rounded-xl border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] shadow-[var(--shadow-card)]">
        <div className="border-b border-[var(--gogo-divider)] px-6 py-4">
          <h3 className="text-sm font-semibold text-[var(--gogo-text-primary)]">Module Preset</h3>
          <p className="mt-0.5 text-xs text-[var(--gogo-text-secondary)]">Select which modules to activate for this organization. You can always change this later.</p>
        </div>
        <div className="grid gap-3 px-6 py-5 sm:grid-cols-3">
          {PRESETS.map((p) => (
            <button key={p.id} type="button" onClick={() => setSelectedPreset(p.id)} className={`relative rounded-xl border p-4 text-left transition-all ${selectedPreset === p.id ? 'shadow-sm' : 'hover:border-[var(--gogo-divider-hover)]'}`} style={{ borderColor: selectedPreset === p.id ? 'var(--gogo-primary)' : 'var(--gogo-divider)', backgroundColor: selectedPreset === p.id ? 'color-mix(in srgb,var(--gogo-primary) 5%,var(--gogo-surface))' : 'var(--gogo-surface)' }}>
              {p.recommended && <span className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ backgroundColor: 'var(--gogo-primary)' }}>Recommended</span>}
              <p className="text-sm font-semibold text-[var(--gogo-text-primary)]">{p.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--gogo-text-secondary)]">{p.description}</p>
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-between gap-3">
        <button type="button" onClick={handleSkip} className="rounded-lg border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] px-4 py-2.5 text-sm font-medium text-[var(--gogo-text-secondary)] shadow-[var(--shadow-card)] transition hover:bg-[var(--gogo-divider)] hover:text-[var(--gogo-text-primary)]">
          Skip for now
        </button>
        <button type="button" onClick={handleApplyPreset} disabled={applying} className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50" style={{ backgroundColor: 'var(--gogo-primary)' }}>
          {applying && <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
          {applying ? 'Applying…' : 'Apply & Finish'}
        </button>
      </div>
    </div>
  );
}
