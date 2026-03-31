'use client';

import { useState } from 'react';
import PageHeader from '@/components/page-header';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import Input from '@/components/ui/input';
import Button from '@/components/ui/button';
import Alert from '@/components/ui/alert';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined as unknown as string }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.currentPassword) errs.currentPassword = 'Current password is required';
    if (form.newPassword.length < 8) errs.newPassword = 'Must be at least 8 characters';
    if (form.newPassword !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (form.currentPassword === form.newPassword) errs.newPassword = 'New password must be different';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setMessage(null);
    try {
      await authApi.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setMessage({ type: 'success', text: 'Password changed successfully. Please log in again.' });
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      const msg = err.response?.data?.message ?? 'Failed to change password. Please try again.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setSaving(false);
    }
  };

  const requirements = [
    { label: 'At least 8 characters', met: form.newPassword.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(form.newPassword) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(form.newPassword) },
    { label: 'Contains a number', met: /\d/.test(form.newPassword) },
    { label: 'Contains special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(form.newPassword) },
  ];

  const strength = requirements.filter((r) => r.met).length;
  const strengthLabel = ['', 'Weak', 'Weak', 'Fair', 'Strong', 'Excellent'][strength];
  const strengthColor = ['', 'bg-red-500', 'bg-red-500', 'bg-amber-500', 'bg-blue-500', 'bg-emerald-500'][strength];

  return (
    <div className="space-y-6">
      <PageHeader title="Change Password" subtitle="Update your account password" />
      <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800">


        {message && <div className="mb-6"><Alert type={message.type}>{message.text}</Alert></div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input id="currentPassword" label="Current Password" type="password" placeholder="Enter current password" value={form.currentPassword} onChange={(e) => update('currentPassword', e.target.value)} error={errors.currentPassword} required autoComplete="current-password" />

          <div>
            <Input id="newPassword" label="New Password" type="password" placeholder="Enter new password" value={form.newPassword} onChange={(e) => update('newPassword', e.target.value)} error={errors.newPassword} required autoComplete="new-password" />
            {form.newPassword.length > 0 && (
              <div className="mt-3">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs text-gray-400">Password strength</span>
                  <span className={`text-xs font-semibold ${strength <= 2 ? 'text-red-600' : strength <= 3 ? 'text-amber-600' : strength <= 4 ? 'text-blue-600' : 'text-emerald-600'}`}>{strengthLabel}</span>
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

          <Input id="confirmPassword" label="Confirm New Password" type="password" placeholder="Re-enter new password" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} error={errors.confirmPassword} required autoComplete="new-password" />

          <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
            <button type="button" onClick={() => router.push('/dashboard')} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">Cancel</button>
            <Button type="submit" loading={saving}>Update Password</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
