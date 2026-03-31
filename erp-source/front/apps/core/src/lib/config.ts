export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Bixo';

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
export const MICROSOFT_CLIENT_ID = process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID || '';
export const MICROSOFT_TENANT = process.env.NEXT_PUBLIC_MICROSOFT_TENANT || 'common';
export const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || '';
export const APPLE_CLIENT_ID = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID || '';

export function getOAuthRedirectUri() {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/auth/callback`;
}
