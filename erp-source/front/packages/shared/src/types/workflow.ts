import type { AuditFields } from "./common";

// ─── Workflow ────────────────────────────────

export type ApprovalStatus = "pending" | "approved" | "rejected" | "escalated";

export interface ApprovalRequest extends AuditFields {
  id: string;
  workflowName: string;
  entityType: string;
  entityId: string;
  requesterId: string;
  requesterName: string;
  currentApproverId: string;
  currentApproverName: string;
  status: ApprovalStatus;
  steps: ApprovalStep[];
}

export interface ApprovalStep {
  id: string;
  stepNumber: number;
  approverId: string;
  approverName: string;
  status: ApprovalStatus;
  comment: string | null;
  actionDate: string | null;
}
