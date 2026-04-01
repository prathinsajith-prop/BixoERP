'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/auth';
import { GOOGLE_CLIENT_ID, MICROSOFT_CLIENT_ID, MICROSOFT_TENANT, GITHUB_CLIENT_ID, APPLE_CLIENT_ID, getOAuthRedirectUri } from '@/lib/config';
import AuthLayout from '@/components/layout/auth-layout';
import Input from '@/components/ui/input';
import Button from '@/components/ui/button';
import Alert from '@/components/ui/alert';

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: authRegister, isLoading, error } = useAuthStore();
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const handleSocialLogin = (provider: string) => {
    setSocialLoading(provider);
    const state = crypto.randomUUID();
    sessionStorage.setItem('oauth_state', state);
    const redirectUri = `${getOAuthRedirectUri()}/${provider}`;
    let url = '';
    if (provider === 'google') url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&state=${state}&access_type=offline&prompt=consent`;
    else if (provider === 'microsoft') url = `https://login.microsoftonline.com/${MICROSOFT_TENANT}/oauth2/v2.0/authorize?client_id=${MICROSOFT_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&state=${state}`;
    else if (provider === 'github') url = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email&state=${state}`;
    else if (provider === 'apple') url = `https://appleid.apple.com/auth/authorize?client_id=${APPLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=name%20email&response_mode=query&state=${state}`;
    if (url) window.location.href = url;
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await authRegister(data);
      router.replace('/login');
    } catch { /* error is set in the store */ }
  };

  return (
    <AuthLayout>
      <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">Create your account</h2>

      {error && <div className="mb-4"><Alert>{error}</Alert></div>}

      <div className="mb-6 space-y-3">
        {(['google', 'microsoft', 'github', 'apple'] as const).map((provider) => (
          <button key={provider} type="button" onClick={() => handleSocialLogin(provider)} disabled={isLoading || !!socialLoading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm transition hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow disabled:cursor-not-allowed disabled:opacity-50">
            {socialLoading === provider ? 'Redirecting…' : `Sign up with ${provider.charAt(0).toUpperCase() + provider.slice(1)}`}
          </button>
        ))}
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-700" /></div>
        <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-gray-800 px-3 text-gray-400">Or register with email</span></div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input id="firstName" label="First name" error={errors.firstName?.message} autoComplete="given-name" {...register('firstName')} />
          <Input id="lastName" label="Last name" error={errors.lastName?.message} autoComplete="family-name" {...register('lastName')} />
        </div>
        <Input id="email" label="Email address" type="email" placeholder="you@company.com" error={errors.email?.message} autoComplete="email" {...register('email')} />
        <Input id="password" label="Password" type="password" placeholder="Min 8 characters" error={errors.password?.message} autoComplete="new-password" {...register('password')} />
        <Button type="submit" loading={isLoading} className="w-full">Create account</Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-accent-600 hover:text-accent-500">Sign in</Link>
      </p>
    </AuthLayout>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error } = useAuthStore();
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' });

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSocialLogin = (provider: string) => {
    setSocialLoading(provider);
    const state = crypto.randomUUID();
    sessionStorage.setItem('oauth_state', state);
    const redirectUri = `${getOAuthRedirectUri()}/${provider}`;
    let url = '';
    if (provider === 'google') url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&state=${state}&access_type=offline&prompt=consent`;
    else if (provider === 'microsoft') url = `https://login.microsoftonline.com/${MICROSOFT_TENANT}/oauth2/v2/authorize?client_id=${MICROSOFT_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&state=${state}`;
    else if (provider === 'github') url = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email&state=${state}`;
    else if (provider === 'apple') url = `https://appleid.apple.com/auth/authorize?client_id=${APPLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=name%20email&response_mode=query&state=${state}`;
    if (url) window.location.href = url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(form);
      router.replace('/login');
    } catch { /* error is set in the store */ }
  };

  return (
    <AuthLayout>
      <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">Create your account</h2>

      {error && <div className="mb-4"><Alert>{error}</Alert></div>}

      <div className="mb-6 space-y-3">
        {(['google', 'microsoft', 'github', 'apple'] as const).map((provider) => (
          <button key={provider} type="button" onClick={() => handleSocialLogin(provider)} disabled={isLoading || !!socialLoading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm transition hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow disabled:cursor-not-allowed disabled:opacity-50">
            {socialLoading === provider ? 'Redirecting…' : `Sign up with ${provider.charAt(0).toUpperCase() + provider.slice(1)}`}
          </button>
        ))}
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-700" /></div>
        <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-gray-800 px-3 text-gray-400">Or register with email</span></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input id="firstName" label="First name" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} required />
          <Input id="lastName" label="Last name" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} required />
        </div>
        <Input id="email" label="Email address" type="email" placeholder="you@company.com" value={form.email} onChange={(e) => update('email', e.target.value)} required autoComplete="email" />
        <Input id="password" label="Password" type="password" placeholder="Min 8 characters" value={form.password} onChange={(e) => update('password', e.target.value)} required minLength={8} autoComplete="new-password" />
        <Button type="submit" loading={isLoading} className="w-full">Create account</Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-accent-600 hover:text-accent-500">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
