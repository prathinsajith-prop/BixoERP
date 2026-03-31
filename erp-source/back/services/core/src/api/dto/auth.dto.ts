import { z } from 'zod';

export const RegisterDto = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
});
export type RegisterDto = z.infer<typeof RegisterDto>;

export const LoginDto = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginDto = z.infer<typeof LoginDto>;

export const RefreshTokenDto = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshTokenDto = z.infer<typeof RefreshTokenDto>;

export const ChangePasswordDto = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});
export type ChangePasswordDto = z.infer<typeof ChangePasswordDto>;

export const RequestPasswordResetDto = z.object({
  email: z.string().email(),
});
export type RequestPasswordResetDto = z.infer<typeof RequestPasswordResetDto>;

export const ResetPasswordDto = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});
export type ResetPasswordDto = z.infer<typeof ResetPasswordDto>;

export const ScopeTokenDto = z.object({
  module: z.string().min(1).max(50).regex(/^[a-z][a-z0-9_-]*$/),
});
export type ScopeTokenDto = z.infer<typeof ScopeTokenDto>;

export const CreateRoleDto = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).default(''),
  permissionIds: z.array(z.string().uuid()).default([]),
});
export type CreateRoleDto = z.infer<typeof CreateRoleDto>;

export const UpdateRoleDto = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).default(''),
  permissionIds: z.array(z.string().uuid()).default([]),
});
export type UpdateRoleDto = z.infer<typeof UpdateRoleDto>;

export const AssignRoleDto = z.object({
  roleId: z.string().uuid(),
});
export type AssignRoleDto = z.infer<typeof AssignRoleDto>;

export const CreatePermissionDto = z.object({
  resource: z.string().min(1).max(100),
  action: z.string().min(1).max(50),
  description: z.string().max(500).default(''),
});
export type CreatePermissionDto = z.infer<typeof CreatePermissionDto>;
