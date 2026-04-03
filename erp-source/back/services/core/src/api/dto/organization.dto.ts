import { z } from 'zod';

export const CreateOrganizationDto = z.object({
  name: z.string().min(1).max(200),
  slug: z
    .string()
    .min(2)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().max(500).default(''),
});
export type CreateOrganizationDto = z.infer<typeof CreateOrganizationDto>;

export const UpdateOrganizationDto = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z
    .string()
    .min(2)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens')
    .optional(),
  description: z.string().max(500).optional(),
});
export type UpdateOrganizationDto = z.infer<typeof UpdateOrganizationDto>;

export const AddMemberDto = z.object({
  userId: z.string().uuid(),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER']).default('MEMBER'),
});
export type AddMemberDto = z.infer<typeof AddMemberDto>;

export const UpdateMemberRoleDto = z.object({
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER']),
});
export type UpdateMemberRoleDto = z.infer<typeof UpdateMemberRoleDto>;

export const SwitchOrganizationDto = z.object({
  organizationId: z.string().uuid(),
});
export type SwitchOrganizationDto = z.infer<typeof SwitchOrganizationDto>;

export const UpdateBrandingDto = z.object({
  primaryColor: z.string().max(7).optional(),
  secondaryColor: z.string().max(7).optional(),
  accentColor: z.string().max(7).optional(),
  logoUrl: z.string().max(500).optional(),
  faviconUrl: z.string().max(500).optional(),
  customCss: z.string().max(5000).optional(),
});
export type UpdateBrandingDto = z.infer<typeof UpdateBrandingDto>;
