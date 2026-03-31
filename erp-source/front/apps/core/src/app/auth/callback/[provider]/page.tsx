'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { getOAuthRedirectUri } from '@/lib/config';
import AuthLayout from '@/components/layout/auth-layout';

export default function OAuthCallbackPage({ params }: { params: Promise<{ provider: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { socialLogin } = useAuthStore();
  const calledRef = useRef(false);
  const resolvedParams = useRef<{ provider: string } | null>(null);

  useEffect(() => {
    params.then((p) => {
      resolvedParams.current = p;
    });
  }, [params]);

  useEffect(() => {
    if (calledRef.current) return;

    const run = async () => {
      const p = await params;
      if (calledRef.current) return;
      calledRef.current = true;

      const provider = p.provider;
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      const savedState = sessionStorage.getItem('oauth_state');
      sessionStorage.removeItem('oauth_state');

      if (error || !code) {
        router.replace(`/login?oauth_error=${encodeURIComponent(error || 'Authorization was cancelled.')}`);
        return;
      }

      if (savedState && state !== savedState) {
        router.replace('/login?oauth_error=Invalid+OAuth+state.+Please+try+again.');
        return;
      }

      const redirectUri = `${getOAuthRedirectUri()}/${provider}`;

      let body: Record<string, unknown>;
      if (provider === 'google') {
        body = { idToken: code };
      } else if (provider === 'apple') {
        body = { code, redirectUri, firstName: searchParams.get('firstName') || '', lastName: searchParams.get('lastName') || '' };
      } else {
        body = { code, redirectUri };
      }

      try {
        const result = await socialLogin(provider, body);
        if (result?.twoFactorRequired) {
          sessionStorage.setItem('2fa_token', result.twoFactorToken || '');
          router.replace('/2fa/verify');
        } else {
          router.replace('/');
        }
      } catch {
        router.replace('/login?oauth_error=Social+login+failed.+Please+try+again.');
      }
    };

    run();
  }, [params, searchParams, socialLogin, router]);

  return (
    <AuthLayout>
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-gray-200 border-t-accent-600" />
        <p className="text-sm text-gray-500">Completing sign in…</p>
      </div>
    </AuthLayout>
  );
}
