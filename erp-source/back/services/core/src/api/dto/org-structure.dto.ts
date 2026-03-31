import { z } from 'zod';

const codeRegex = /^[A-Z0-9][A-Z0-9_-]{0,48}[A-Z0-9]$|^[A-Z0-9]$/;

export const CreateDepartmentDto = z.object({
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(50).regex(codeRegex, 'Code must be uppercase alphanumeric with hyphens/underscores'),
  description: z.string().max(1000).default(''),
  divisionId: z.string().uuid().nullable().default(null),
  headUserId: z.string().uuid().nullable().default(null),
});
export type CreateDepartmentDto = z.infer<typeof CreateDepartmentDto>;

export const UpdateDepartmentDto = z.object({
  name: z.string().min(1).max(200).optional(),
  code: z.string().min(1).max(50).regex(codeRegex).optional(),
  description: z.string().max(1000).optional(),
  divisionId: z.string().uuid().nullable().optional(),
  headUserId: z.string().uuid().nullable().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});
export type UpdateDepartmentDto = z.infer<typeof UpdateDepartmentDto>;

export const CreateDivisionDto = z.object({
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(50).regex(codeRegex, 'Code must be uppercase alphanumeric with hyphens/underscores'),
  description: z.string().max(1000).default(''),
  headUserId: z.string().uuid().nullable().default(null),
});
export type CreateDivisionDto = z.infer<typeof CreateDivisionDto>;

export const UpdateDivisionDto = z.object({
  name: z.string().min(1).max(200).optional(),
  code: z.string().min(1).max(50).regex(codeRegex).optional(),
  description: z.string().max(1000).optional(),
  headUserId: z.string().uuid().nullable().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});
export type UpdateDivisionDto = z.infer<typeof UpdateDivisionDto>;

export const CreateTeamDto = z.object({
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(50).regex(codeRegex, 'Code must be uppercase alphanumeric with hyphens/underscores'),
  description: z.string().max(1000).default(''),
  departmentId: z.string().uuid().nullable().default(null),
  leadUserId: z.string().uuid().nullable().default(null),
});
export type CreateTeamDto = z.infer<typeof CreateTeamDto>;

export const UpdateTeamDto = z.object({
  name: z.string().min(1).max(200).optional(),
  code: z.string().min(1).max(50).regex(codeRegex).optional(),
  description: z.string().max(1000).optional(),
  departmentId: z.string().uuid().nullable().optional(),
  leadUserId: z.string().uuid().nullable().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});
export type UpdateTeamDto = z.infer<typeof UpdateTeamDto>;

// ─── Manager Assignments ────────────────────────────────────

export const AssignManagerDto = z.object({
  userId: z.string().uuid(),
  role: z.enum(['manager', 'assistant_manager']),
});
export type AssignManagerDto = z.infer<typeof AssignManagerDto>;

// ─── Manager Settings ───────────────────────────────────────

export const UpdateManagerSettingsDto = z.object({
  entityType: z.string().max(30).optional(),
  entityId: z.string().uuid().nullable().optional(),
  // Notification preferences
  notifyMemberJoin: z.boolean().optional(),
  notifyMemberLeave: z.boolean().optional(),
  notifyTaskAssigned: z.boolean().optional(),
  notifyApprovalRequest: z.boolean().optional(),
  notifyEscalation: z.boolean().optional(),
  notifyReportReady: z.boolean().optional(),
  // Workflow preferences
  autoApproveLeave: z.boolean().optional(),
  autoApproveExpense: z.boolean().optional(),
  delegateToUserId: z.string().uuid().nullable().optional(),
  delegationActive: z.boolean().optional(),
  // Visibility
  visibleInDirectory: z.boolean().optional(),
  receiveWeeklySummary: z.boolean().optional(),
});
export type UpdateManagerSettingsDto = z.infer<typeof UpdateManagerSettingsDto>;
