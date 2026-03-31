import { z } from 'zod';

// --- Workflow Definition DTOs ---

const WorkflowStepDefinitionSchema = z.object({
  stepOrder: z.number().int().positive(),
  name: z.string().min(1).max(100),
  stepType: z.enum(['SINGLE_APPROVER', 'ALL_APPROVERS', 'ANY_APPROVER', 'AUTO_APPROVE', 'MANAGER_CHAIN']),
  approverUserIds: z.array(z.string().uuid()).default([]),
  approverRoleIds: z.array(z.string()).default([]),
  autoEscalateAfterHours: z.number().positive().nullable().optional().default(null),
  conditions: z.record(z.unknown()).nullable().optional().default(null),
});

export const CreateWorkflowDefinitionDto = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(255),
  description: z.string().max(1000).nullable().optional(),
  entityType: z.string().min(1).max(50),
  steps: z.array(WorkflowStepDefinitionSchema).min(1),
});

export type CreateWorkflowDefinitionDtoType = z.infer<typeof CreateWorkflowDefinitionDto>;

export const UpdateWorkflowDefinitionDto = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
  steps: z.array(WorkflowStepDefinitionSchema).min(1).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateWorkflowDefinitionDtoType = z.infer<typeof UpdateWorkflowDefinitionDto>;

// --- Approval Request DTOs ---

export const SubmitApprovalRequestDto = z.object({
  workflowDefinitionCode: z.string().min(1).max(50),
  entityType: z.string().min(1).max(50),
  entityId: z.string().uuid(),
  metadata: z.record(z.unknown()).nullable().optional(),
});

export type SubmitApprovalRequestDtoType = z.infer<typeof SubmitApprovalRequestDto>;

export const ProcessApprovalStepDto = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  comment: z.string().max(2000).nullable().optional(),
});

export type ProcessApprovalStepDtoType = z.infer<typeof ProcessApprovalStepDto>;

export const EscalateRequestDto = z.object({
  reason: z.string().min(1).max(2000),
});

export type EscalateRequestDtoType = z.infer<typeof EscalateRequestDto>;

export const CancelRequestDto = z.object({
  reason: z.string().max(2000).optional(),
});

export type CancelRequestDtoType = z.infer<typeof CancelRequestDto>;

// --- Delegation Rule DTOs ---

export const CreateDelegationRuleDto = z.object({
  fromUserId: z.string().uuid(),
  toUserId: z.string().uuid(),
  entityType: z.string().max(50).nullable().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export type CreateDelegationRuleDtoType = z.infer<typeof CreateDelegationRuleDto>;

// --- Query DTOs ---

export const ListApprovalRequestsQuery = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'ESCALATED', 'CANCELLED']).optional(),
  entityType: z.string().max(50).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ListApprovalRequestsQueryType = z.infer<typeof ListApprovalRequestsQuery>;
