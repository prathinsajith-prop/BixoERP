import { Injectable, Inject, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ApprovalRequest } from '../../domain/entities/approval-request.entity';
import {
  WorkflowDefinitionRepository,
  WORKFLOW_DEFINITION_REPOSITORY,
} from '../../domain/repositories/workflow-definition.repository';
import {
  ApprovalRequestRepository,
  APPROVAL_REQUEST_REPOSITORY,
} from '../../domain/repositories/approval-request.repository';
import { ApprovalEngine } from '../../domain/services/approval-engine.service';
import { EntityNotFoundException, BusinessRuleViolation } from '../../domain/exceptions/domain.exceptions';

export interface SubmitApprovalRequestInput {
  workflowDefinitionCode: string;
  entityType: string;
  entityId: string;
  tenantId: string;
  requestedBy: string;
  metadata: Record<string, unknown> | null;
}

export interface SubmitApprovalRequestOutput {
  id: string;
  status: string;
  currentStepOrder: number;
  totalSteps: number;
}

@Injectable()
export class SubmitApprovalRequestUseCase {
  private readonly logger = new Logger(SubmitApprovalRequestUseCase.name);

  constructor(
    @Inject(WORKFLOW_DEFINITION_REPOSITORY)
    private readonly definitionRepo: WorkflowDefinitionRepository,
    @Inject(APPROVAL_REQUEST_REPOSITORY)
    private readonly requestRepo: ApprovalRequestRepository,
    private readonly approvalEngine: ApprovalEngine,
  ) {}

  async execute(input: SubmitApprovalRequestInput): Promise<SubmitApprovalRequestOutput> {
    const definition = await this.definitionRepo.findByCode(
      input.workflowDefinitionCode,
      input.tenantId,
    );
    if (!definition) {
      throw new EntityNotFoundException('WorkflowDefinition', input.workflowDefinitionCode);
    }
    if (!definition.isActive) {
      throw new BusinessRuleViolation(`Workflow definition ${definition.code} is not active`);
    }

    const requestId = uuidv4();
    const steps = this.approvalEngine.buildSteps(requestId, definition);

    const request = ApprovalRequest.create({
      workflowDefinitionId: definition.id,
      entityType: input.entityType,
      entityId: input.entityId,
      tenantId: input.tenantId,
      requestedBy: input.requestedBy,
      totalSteps: definition.totalSteps,
      steps,
      metadata: input.metadata,
    });

    await this.requestRepo.saveWithOutbox(request);
    this.logger.log(`Approval request ${request.id} created for ${input.entityType}/${input.entityId}`);

    return {
      id: request.id,
      status: request.status,
      currentStepOrder: request.currentStepOrder,
      totalSteps: request.totalSteps,
    };
  }
}
