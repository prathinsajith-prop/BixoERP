import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  ApprovalRequestRepository,
  APPROVAL_REQUEST_REPOSITORY,
} from '../../domain/repositories/approval-request.repository';
import {
  WorkflowDefinitionRepository,
  WORKFLOW_DEFINITION_REPOSITORY,
} from '../../domain/repositories/workflow-definition.repository';
import { ApprovalEngine } from '../../domain/services/approval-engine.service';
import { EntityNotFoundException } from '../../domain/exceptions/domain.exceptions';

export interface EscalateRequestInput {
  requestId: string;
  reason: string;
  tenantId: string;
}

export interface EscalateRequestOutput {
  id: string;
  status: string;
}

@Injectable()
export class EscalateRequestUseCase {
  private readonly logger = new Logger(EscalateRequestUseCase.name);

  constructor(
    @Inject(APPROVAL_REQUEST_REPOSITORY)
    private readonly requestRepo: ApprovalRequestRepository,
    @Inject(WORKFLOW_DEFINITION_REPOSITORY)
    private readonly definitionRepo: WorkflowDefinitionRepository,
    private readonly approvalEngine: ApprovalEngine,
  ) {}

  async execute(input: EscalateRequestInput): Promise<EscalateRequestOutput> {
    const request = await this.requestRepo.findById(input.requestId, input.tenantId);
    if (!request) {
      throw new EntityNotFoundException('ApprovalRequest', input.requestId);
    }

    request.escalate(input.reason);
    await this.requestRepo.saveWithOutbox(request);

    this.logger.log(`Request ${request.id} escalated: ${input.reason}`);

    return {
      id: request.id,
      status: request.status,
    };
  }

  /** Called by scheduler to auto-escalate overdue requests */
  async autoEscalateOverdue(tenantId?: string): Promise<number> {
    const thresholdDate = new Date();
    const pending = await this.requestRepo.findPendingEscalatable(thresholdDate, tenantId);

    let escalatedCount = 0;
    for (const request of pending) {
      const definition = await this.definitionRepo.findById(
        request.workflowDefinitionId,
        request.tenantId,
      );
      if (!definition) continue;

      if (this.approvalEngine.shouldAutoEscalate(request, definition)) {
        request.escalate('Auto-escalated due to timeout');
        await this.requestRepo.saveWithOutbox(request);
        escalatedCount++;
        this.logger.log(`Auto-escalated request ${request.id}`);
      }
    }

    return escalatedCount;
  }
}
