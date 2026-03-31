import { ApprovalRequest } from '../entities/approval-request.entity';
import { ApprovalStatus } from '../value-objects/approval-status';

export interface ApprovalRequestRepository {
  findById(id: string, tenantId: string): Promise<ApprovalRequest | null>;
  findByEntity(entityType: string, entityId: string, tenantId: string): Promise<ApprovalRequest[]>;
  findByApprover(userId: string, tenantId: string, status?: ApprovalStatus): Promise<ApprovalRequest[]>;
  findByRequester(requestedBy: string, tenantId: string): Promise<ApprovalRequest[]>;
  findPendingEscalatable(thresholdDate: Date, tenantId?: string): Promise<ApprovalRequest[]>;
  save(request: ApprovalRequest): Promise<ApprovalRequest>;
  saveWithOutbox(request: ApprovalRequest): Promise<ApprovalRequest>;
}

export const APPROVAL_REQUEST_REPOSITORY = Symbol('ApprovalRequestRepository');
