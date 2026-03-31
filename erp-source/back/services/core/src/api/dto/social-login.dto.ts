import { z } from 'zod';

export const GoogleLoginDto = z.object({
  idToken: z.string().min(1, 'ID token is required'),
});
export type GoogleLoginDto = z.infer<typeof GoogleLoginDto>;

export const GithubLoginDto = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  redirectUri: z.string().url('Valid redirect URI is required'),
});
export type GithubLoginDto = z.infer<typeof GithubLoginDto>;

export const MicrosoftLoginDto = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  redirectUri: z.string().url('Valid redirect URI is required'),
});
export type MicrosoftLoginDto = z.infer<typeof MicrosoftLoginDto>;

export const AppleLoginDto = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  redirectUri: z.string().url('Valid redirect URI is required'),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
});
export type AppleLoginDto = z.infer<typeof AppleLoginDto>;
