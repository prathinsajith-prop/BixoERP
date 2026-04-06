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

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const watchedPassword = watch('password') ?? '';
  const passwordRequirements = [
    { label: 'At least 8 characters', met: watchedPassword.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(watchedPassword) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(watchedPassword) },
    { label: 'Contains a number', met: /\d/.test(watchedPassword) },
    { label: 'Contains special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(watchedPassword) },
  ];
  const passwordStrength = passwordRequirements.filter((r) => r.met).length;
  const passwordStrengthLabel = ['', 'Weak', 'Weak', 'Fair', 'Strong', 'Excellent'][passwordStrength];
  const passwordStrengthColor = ['', 'bg-red-500', 'bg-red-500', 'bg-amber-500', 'bg-blue-500', 'bg-emerald-500'][passwordStrength];

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
        {watchedPassword.length > 0 && (
          <div className="mt-2">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs text-gray-400">Password strength</span>
              <span className={`text-xs font-semibold ${passwordStrength <= 2 ? 'text-red-600' : passwordStrength <= 3 ? 'text-amber-600' : passwordStrength <= 4 ? 'text-blue-600' : 'text-emerald-600'}`}>{passwordStrengthLabel}</span>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full transition ${i <= passwordStrength ? passwordStrengthColor : 'bg-gray-100 dark:bg-gray-800'}`} />
              ))}
            </div>
          </div>
        )}
        <Button type="submit" loading={isLoading} className="w-full">Create account</Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-accent-600 hover:text-accent-500">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
