import { z } from 'zod';

// ─── Project DTOs ────────────────────────────────────────────────────────────

export const CreateProjectDto = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(1).max(2000),
  managerId: z.string().uuid(),
  customerId: z.string().uuid().nullable().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().nullable().optional(),
  currency: z.string().length(3),
});

export type CreateProjectDtoType = z.infer<typeof CreateProjectDto>;

export const UpdateProjectStatusDto = z.object({
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']),
});

export type UpdateProjectStatusDtoType = z.infer<typeof UpdateProjectStatusDto>;

export const UpdateProjectDto = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().min(1).max(2000).optional(),
  managerId: z.string().uuid().optional(),
  endDate: z.string().datetime().nullable().optional(),
});

export type UpdateProjectDtoType = z.infer<typeof UpdateProjectDto>;

// ─── Task DTOs ───────────────────────────────────────────────────────────────

export const CreateTaskDto = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().min(1).max(2000),
  assigneeId: z.string().uuid().nullable().optional(),
  milestoneId: z.string().uuid().nullable().optional(),
  priority: z.number().int().min(0).max(10).optional(),
  estimatedHours: z.number().min(0).optional(),
  dueDate: z.string().datetime().nullable().optional(),
});

export type CreateTaskDtoType = z.infer<typeof CreateTaskDto>;

export const UpdateTaskStatusDto = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED']),
});

export type UpdateTaskStatusDtoType = z.infer<typeof UpdateTaskStatusDto>;

export const AssignTaskDto = z.object({
  assigneeId: z.string().uuid(),
});

export type AssignTaskDtoType = z.infer<typeof AssignTaskDto>;

// ─── Milestone DTOs ──────────────────────────────────────────────────────────

export const CreateMilestoneDto = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().min(1).max(2000),
  dueDate: z.string().datetime(),
});

export type CreateMilestoneDtoType = z.infer<typeof CreateMilestoneDto>;

// ─── Timesheet DTOs ──────────────────────────────────────────────────────────

export const LogTimesheetDto = z.object({
  projectId: z.string().uuid(),
  taskId: z.string().uuid().nullable().optional(),
  date: z.string().datetime(),
  hours: z.number().positive().max(24),
  description: z.string().min(1).max(1000),
  billable: z.boolean().optional(),
});

export type LogTimesheetDtoType = z.infer<typeof LogTimesheetDto>;

export const ApproveTimesheetDto = z.object({
  entryId: z.string().uuid(),
});

export type ApproveTimesheetDtoType = z.infer<typeof ApproveTimesheetDto>;

// ─── Budget DTOs ─────────────────────────────────────────────────────────────

export const SetProjectBudgetDto = z.object({
  totalBudget: z.number().min(0),
  laborBudget: z.number().min(0),
  materialBudget: z.number().min(0),
  currency: z.string().length(3),
});

export type SetProjectBudgetDtoType = z.infer<typeof SetProjectBudgetDto>;
