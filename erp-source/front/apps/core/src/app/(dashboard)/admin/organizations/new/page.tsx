'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { showToast } from '@erp/shell';
import PageHeader from '@/components/page-header';
import { Input, Textarea, Button } from '@erp/ui';

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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
                <PageHeader
                    title="New Organization"
                    subtitle="Create a new organization in the system"
                    action={
                        <button
                            type="button"
                            onClick={() => router.push('/admin/organizations')}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                            Cancel
                        </button>
                    }
                />

                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800">
                        <h3 className="mb-5 text-base font-semibold text-gray-900 dark:text-white">Organization details</h3>
                        <div className="space-y-5">
                            <Input label="Name" type="text" value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Acme Corp" required />
                            <div>
                                <Input label="Slug" type="text" value={slug} onChange={(e) => { setSlugManual(true); setSlug(e.target.value); }} placeholder="acme-corp" required pattern="[a-z0-9]+(-[a-z0-9]+)*" title="Lowercase letters, numbers and hyphens only" className="font-mono" />
                                <p className="mt-1 text-xs text-gray-400">URL-friendly identifier. Lowercase letters, numbers and hyphens only.</p>
                            </div>
                            <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A short description of the organization" rows={3} maxLength={500} />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button variant="outline" type="button" onClick={() => router.push('/admin/organizations')}>Cancel</Button>
                        <Button type="submit" disabled={saving || !name.trim() || !slug.trim()} loading={saving}>Create organization</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
