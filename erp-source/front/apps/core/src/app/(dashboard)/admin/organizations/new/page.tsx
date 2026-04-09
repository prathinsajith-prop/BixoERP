'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { showToast } from '@erp/shell';
import PageHeader from '@/components/page-header';
import { Input, Textarea } from '@erp/ui';

export default function NewOrganizationPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [description, setDescription] = useState('');
    const [saving, setSaving] = useState(false);
    const [slugManual, setSlugManual] = useState(false);

    const autoSlug = (n: string) =>
        n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

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
            showToast.success('Organization created', `"${name}" has been created.`);
            router.push(`/admin/organizations/${created?.id ?? ''}`);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            showToast.error('Create failed', msg || 'Could not create organization.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="New Organization"
                subtitle="Create a new organization in the system"
                action={
                    <button
                        type="button"
                        onClick={() => router.push('/admin/organizations')}
                        className="rounded-lg border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] px-4 py-2 text-sm font-medium text-[var(--gogo-text-secondary)] shadow-[var(--shadow-card)] transition hover:bg-[var(--gogo-divider)] hover:text-[var(--gogo-text-primary)]"
                    >
                        Cancel
                    </button>
                }
            />

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="overflow-hidden rounded-xl border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] shadow-[var(--shadow-card)]">
                    <div className="flex items-center gap-3 border-b border-[var(--gogo-divider)] px-6 py-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
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
                    <button type="button" onClick={() => router.push('/admin/organizations')} className="rounded-lg border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] px-4 py-2.5 text-sm font-medium text-[var(--gogo-text-secondary)] shadow-[var(--shadow-card)] transition hover:bg-[var(--gogo-divider)] hover:text-[var(--gogo-text-primary)]">
                        Cancel
                    </button>
                    <button type="submit" disabled={saving || !name.trim() || !slug.trim()} className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50" style={{ backgroundColor: 'var(--gogo-primary)' }}>
                        {saving && <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                        Create Organization
                    </button>
                </div>
            </form>
        </div>
    );
}
