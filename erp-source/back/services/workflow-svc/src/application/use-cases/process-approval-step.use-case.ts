import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  ApprovalRequestRepository,
  APPROVAL_REQUEST_REPOSITORY,
} from '../../domain/repositories/approval-request.repository';
import { ApprovalEngine } from '../../domain/services/approval-engine.service';
import { DelegationRule } from '../../domain/entities/delegation-rule.entity';
import { EntityNotFoundException } from '../../domain/exceptions/domain.exceptions';
import { CachePort, CACHE_PORT } from '../ports/cache.port';

export interface ProcessApprovalStepInput {
  requestId: string;
  action: 'APPROVE' | 'REJECT';
  userId: string;
  userRoles: string[];
  comment: string | null;
  tenantId: string;
  delegationRules: DelegationRule[];
}

export interface ProcessApprovalStepOutput {
  id: string;
  status: string;
  currentStepOrder: number;
  totalSteps: number;
}

@Injectable()
export class ProcessApprovalStepUseCase {
  private readonly logger = new Logger(ProcessApprovalStepUseCase.name);

  constructor(
    @Inject(APPROVAL_REQUEST_REPOSITORY)
    private readonly requestRepo: ApprovalRequestRepository,
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
    private readonly approvalEngine: ApprovalEngine,
  ) {}

  async execute(input: ProcessApprovalStepInput): Promise<ProcessApprovalStepOutput> {
    const request = await this.requestRepo.findById(input.requestId, input.tenantId);
    if (!request) {
      throw new EntityNotFoundException('ApprovalRequest', input.requestId);
    }

    // Resolve delegation
    const { effectiveUserId, delegatedFrom } = this.approvalEngine.resolveApprover(
      input.userId,
      request.entityType,
      input.delegationRules,
    );

    if (input.action === 'APPROVE') {
      request.approveCurrentStep(effectiveUserId, input.userRoles, input.comment, delegatedFrom);
    } else {
      request.rejectCurrentStep(effectiveUserId, input.userRoles, input.comment);
    }

    await this.requestRepo.saveWithOutbox(request);
    await this.cache.del(`request:${input.tenantId}:${input.requestId}`);

    this.logger.log(
      `Approval step ${input.action} by ${effectiveUserId} on request ${request.id}`,
    );

    return {
      id: request.id,
      status: request.status,
      currentStepOrder: request.currentStepOrder,
      totalSteps: request.totalSteps,
    };
  }
}
