'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@erp/ui';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { showToast } from '@erp/shell';
import { Button, Input } from '@erp/ui';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
}).refine((d) => d.currentPassword !== d.newPassword, {
  message: 'New password must be different from current',
  path: ['newPassword'],
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const watchedNewPassword = watch('newPassword') ?? '';

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      await authApi.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      showToast.success('Password changed', 'Please use your new password next time you log in.');
      reset();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to change password. Please try again.';
      showToast.error('Something went wrong', msg);
    }
  };

  const requirements = [
    { label: 'At least 8 characters', met: watchedNewPassword.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(watchedNewPassword) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(watchedNewPassword) },
    { label: 'Contains a number', met: /\d/.test(watchedNewPassword) },
    { label: 'Contains special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(watchedNewPassword) },
  ];

  const strength = requirements.filter((r) => r.met).length;
  const strengthLabel = ['', 'Weak', 'Weak', 'Fair', 'Strong', 'Excellent'][strength];
  const strengthColor = ['', 'bg-red-500', 'bg-red-500', 'bg-amber-500', 'bg-[var(--gogo-primary)]', 'bg-emerald-500'][strength];

  return (
    <div className="space-y-6">
      <PageHeader title="Change Password" description="Update your account password" />
      <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800">


        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input id="currentPassword" label="Current Password" type="password" placeholder="Enter current password" {...register('currentPassword')} error={errors.currentPassword?.message} autoComplete="current-password" />

          <div>
            <Input id="newPassword" label="New Password" type="password" placeholder="Enter new password" {...register('newPassword')} error={errors.newPassword?.message} autoComplete="new-password" />
            {watchedNewPassword.length > 0 && (
              <div className="mt-3">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs text-gray-400">Password strength</span>
                  <span className={`text-xs font-semibold ${strength <= 2 ? 'text-red-600' : strength <= 3 ? 'text-amber-600' : strength <= 4 ? 'text-[var(--gogo-primary)]' : 'text-emerald-600'}`}>{strengthLabel}</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full transition ${i <= strength ? strengthColor : 'bg-gray-100 dark:bg-gray-800'}`} />
                  ))}
                </div>
                <div className="mt-3 space-y-1.5">
                  {requirements.map((req) => (
                    <div key={req.label} className="flex items-center gap-2">
                      {req.met ? (
                        <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      ) : (
                        <svg className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="9" /></svg>
                      )}
                      <span className={`text-xs ${req.met ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-400'}`}>{req.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Input id="confirmPassword" label="Confirm New Password" type="password" placeholder="Re-enter new password" {...register('confirmPassword')} error={errors.confirmPassword?.message} autoComplete="new-password" />

          <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
            <button type="button" onClick={() => router.push('/')} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">Cancel</button>
            <Button type="submit" loading={isSubmitting}>Update Password</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
