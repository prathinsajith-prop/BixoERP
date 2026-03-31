import { z } from 'zod';

export const VerifySetupDto = z.object({
  totpCode: z.string().length(6).regex(/^\d{6}$/, 'Must be a 6-digit code'),
});
export type VerifySetupDto = z.infer<typeof VerifySetupDto>;

export const ValidateTwoFactorDto = z.object({
  twoFactorToken: z.string().uuid(),
  code: z.string().min(1).max(20),
});
export type ValidateTwoFactorDto = z.infer<typeof ValidateTwoFactorDto>;

export const DisableTwoFactorDto = z.object({
  code: z.string().min(1).max(20),
});
export type DisableTwoFactorDto = z.infer<typeof DisableTwoFactorDto>;

export const RegenerateCodesDto = z.object({
  totpCode: z.string().length(6).regex(/^\d{6}$/, 'Must be a 6-digit code'),
});
export type RegenerateCodesDto = z.infer<typeof RegenerateCodesDto>;
