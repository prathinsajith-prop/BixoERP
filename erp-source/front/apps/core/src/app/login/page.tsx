'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/auth';
import { GOOGLE_CLIENT_ID, MICROSOFT_CLIENT_ID, MICROSOFT_TENANT, GITHUB_CLIENT_ID, APPLE_CLIENT_ID, getOAuthRedirectUri } from '@/lib/config';
import AuthLayout from '@/components/layout/auth-layout';
import Input from '@/components/ui/input';
import Button from '@/components/ui/button';
import Alert from '@/components/ui/alert';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
type LoginFormData = z.infer<typeof loginSchema>;

function SocialButton({ provider, icon, label, onClick, disabled }: { provider: string; icon: React.ReactNode; label: string; onClick: () => void; disabled: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm transition hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow disabled:cursor-not-allowed disabled:opacity-50">
      {icon}
      <span>{label}</span>
    </button>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading, error } = useAuthStore();
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'admin@erp.com', password: 'Admin@123' },
  });

  const oauthError = searchParams.get('oauth_error');

  const getOAuthUrl = (provider: string) => {
    const state = crypto.randomUUID();
    sessionStorage.setItem('oauth_state', state);
    const redirectUri = `${getOAuthRedirectUri()}/${provider}`;

    if (provider === 'google') return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&state=${state}&access_type=offline&prompt=consent`;
    if (provider === 'microsoft') return `https://login.microsoftonline.com/${MICROSOFT_TENANT}/oauth2/v2/authorize?client_id=${MICROSOFT_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&state=${state}`;
    if (provider === 'github') return `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email&state=${state}`;
    if (provider === 'apple') return `https://appleid.apple.com/auth/authorize?client_id=${APPLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=name%20email&response_mode=query&state=${state}`;
    return '#';
  };

  const handleSocialLogin = (provider: string) => {
    setSocialLoading(provider);
    window.location.href = getOAuthUrl(provider);
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      const result = await login(data);
      if (result?.twoFactorRequired) {
        sessionStorage.setItem('2fa_token', result.twoFactorToken || '');
        sessionStorage.setItem('2fa_email', data.email);
        router.replace('/2fa/verify');
      } else {
        router.replace('/');
      }
    } catch { /* error is set in the store */ }
  };

  return (
    <AuthLayout>
      <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">Sign in to your account</h2>

      {(error || oauthError) && <div className="mb-4"><Alert>{error || oauthError}</Alert></div>}

      <div className="mb-6 space-y-3">
        <SocialButton provider="google" onClick={() => handleSocialLogin('google')} disabled={isLoading || !!socialLoading}
          label={socialLoading === 'google' ? 'Redirecting…' : 'Continue with Google'}
          icon={<svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>}
        />
        <SocialButton provider="microsoft" onClick={() => handleSocialLogin('microsoft')} disabled={isLoading || !!socialLoading}
          label={socialLoading === 'microsoft' ? 'Redirecting…' : 'Continue with Microsoft'}
          icon={<svg className="h-5 w-5" viewBox="0 0 21 21"><rect x="1" y="1" width="9" height="9" fill="#F25022" /><rect x="11" y="1" width="9" height="9" fill="#7FBA00" /><rect x="1" y="11" width="9" height="9" fill="#00A4EF" /><rect x="11" y="11" width="9" height="9" fill="#FFB900" /></svg>}
        />
        <SocialButton provider="github" onClick={() => handleSocialLogin('github')} disabled={isLoading || !!socialLoading}
          label={socialLoading === 'github' ? 'Redirecting…' : 'Continue with GitHub'}
          icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" /></svg>}
        />
        <SocialButton provider="apple" onClick={() => handleSocialLogin('apple')} disabled={isLoading || !!socialLoading}
          label={socialLoading === 'apple' ? 'Redirecting…' : 'Continue with Apple'}
          icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" /></svg>}
        />
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-700" /></div>
        <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-gray-800 px-3 text-gray-400">Or continue with email</span></div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input id="email" label="Email address" type="email" placeholder="admin@erp.com" error={errors.email?.message} autoComplete="email" {...register('email')} />
        <Input id="password" label="Password" type="password" placeholder="••••••••" error={errors.password?.message} autoComplete="current-password" {...register('password')} />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input type="checkbox" className="rounded border-gray-300" />
            Remember me
          </label>
          <Link href="/forgot-password" className="text-sm font-medium text-accent-600 hover:text-accent-500">Forgot password?</Link>
        </div>
        <Button type="submit" loading={isLoading} className="w-full">Sign in</Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-medium text-accent-600 hover:text-accent-500">Register</Link>
      </p>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
