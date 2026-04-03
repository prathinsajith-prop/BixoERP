'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import PageHeader from '@/components/page-header';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/store/auth';

const orgSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  slug: z.string().optional(),
  description: z.string().optional(),
});
type OrgFormData = z.infer<typeof orgSchema>;

const generateSlug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export default function CreateOrganizationPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OrgFormData>({
    resolver: zodResolver(orgSchema),
    defaultValues: { name: '', slug: '', description: '' },
  });

  const watchedName = watch('name') ?? '';
  const watchedSlug = watch('slug') ?? '';

  const handleNameChange = (value: string) => {
    setValue('name', value);
    if (!watchedSlug || watchedSlug === generateSlug(watchedName)) {
      setValue('slug', generateSlug(value));
    }
  };

  const onSubmit = async (data: OrgFormData) => {
    setError(null);
    setSaving(true);
    try {
      const res = await authApi.createOrganization({
        name: data.name.trim(),
        slug: data.slug?.trim() || undefined,
        description: data.description?.trim() || undefined,
      });
      const orgId = res.data?.data?.id;
      if (orgId) {
        localStorage.setItem('organizationId', orgId);
        // Switch JWT to the new org so all subsequent data requests use the correct tenantId
        try {
          await useAuthStore.getState().switchOrg(orgId);
        } catch {
          // fall back to old token
        }
      }
      router.push('/organization');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : (msg as string) || 'Failed to create organization.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Create Organization" subtitle="Set up a new organization" />
      <button onClick={() => router.back()} className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
        Back
      </button>

      <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">


        {error && (
          <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200/60 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-800">{error}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Organization Name <span className="text-red-400">*</span>
            </label>
            <input type="text" {...register('name')} onChange={(e) => handleNameChange(e.target.value)} placeholder="Acme Corporation" className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500 dark:focus:ring-blue-900" maxLength={100} autoFocus />
            {errors.name && <div className="mt-1 text-xs text-red-500">{errors.name.message}</div>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Slug</label>
            <input type="text" {...register('slug')} onChange={(e) => setValue('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="acme-corporation" className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500 dark:focus:ring-blue-900" maxLength={100} />
            <p className="mt-1 text-xs text-gray-400">URL-friendly identifier. Auto-generated from name if left blank.</p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <textarea {...register('description')} placeholder="Brief description of the organization..." rows={3} className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500 dark:focus:ring-blue-900 resize-none" maxLength={500} />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={() => router.back()} className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">Cancel</button>
            <button type="submit" disabled={saving || isSubmitting || !watchedName.trim()} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50">{saving ? 'Creating...' : 'Create Organization'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
