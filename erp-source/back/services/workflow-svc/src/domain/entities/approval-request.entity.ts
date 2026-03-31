import { v4 as uuidv4 } from 'uuid';
import { AggregateRoot, DomainEvent } from './aggregate-root.base';
import { ApprovalStatus } from '../value-objects/approval-status';
import { ApprovalStep, ApprovalStepStatus } from './approval-step.entity';
import {
  WorkflowAlreadyCompletedException,
  InvalidStatusTransitionException,
  UnauthorizedApproverException,
} from '../exceptions/domain.exceptions';

export interface ApprovalRequestProps {
  workflowDefinitionId: string;
  entityType: string;
  entityId: string;
  tenantId: string;
  requestedBy: string;
  status: ApprovalStatus;
  currentStepOrder: number;
  totalSteps: number;
  steps: ApprovalStep[];
  metadata: Record<string, unknown> | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class ApprovalRequest extends AggregateRoot<ApprovalRequestProps> {
  get workflowDefinitionId(): string { return this.props.workflowDefinitionId; }
  get entityType(): string { return this.props.entityType; }
  get entityId(): string { return this.props.entityId; }
  get tenantId(): string { return this.props.tenantId; }
  get requestedBy(): string { return this.props.requestedBy; }
  get status(): ApprovalStatus { return this.props.status; }
  get currentStepOrder(): number { return this.props.currentStepOrder; }
  get totalSteps(): number { return this.props.totalSteps; }
  get steps(): ReadonlyArray<ApprovalStep> { return this.props.steps; }
  get metadata(): Record<string, unknown> | null { return this.props.metadata; }
  get completedAt(): Date | null { return this.props.completedAt; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  static create(params: {
    workflowDefinitionId: string;
    entityType: string;
    entityId: string;
    tenantId: string;
    requestedBy: string;
    totalSteps: number;
    steps: ApprovalStep[];
    metadata: Record<string, unknown> | null;
  }): ApprovalRequest {
    const id = uuidv4();
    const now = new Date();
    const request = new ApprovalRequest(
      {
        workflowDefinitionId: params.workflowDefinitionId,
        entityType: params.entityType,
        entityId: params.entityId,
        tenantId: params.tenantId,
        requestedBy: params.requestedBy,
        status: ApprovalStatus.PENDING,
        currentStepOrder: 1,
        totalSteps: params.totalSteps,
        steps: params.steps,
        metadata: params.metadata,
        completedAt: null,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );

    request.addDomainEvent({
      eventId: uuidv4(),
      eventType: 'workflow.approval.needed',
      aggregateId: id,
      tenantId: params.tenantId,
      occurredAt: now,
      payload: {
        requestedBy: params.requestedBy,
        entityType: params.entityType,
        entityId: params.entityId,
        workflowDefinitionId: params.workflowDefinitionId,
        currentStepOrder: 1,
        approverUserIds: params.steps[0]?.approverUserIds ?? [],
      },
    });

    return request;
  }

  static reconstitute(id: string, props: ApprovalRequestProps): ApprovalRequest {
    return new ApprovalRequest(props, id);
  }

  private ensureNotCompleted(): void {
    if (
      this.props.status === ApprovalStatus.APPROVED ||
      this.props.status === ApprovalStatus.REJECTED ||
      this.props.status === ApprovalStatus.CANCELLED
    ) {
      throw new WorkflowAlreadyCompletedException(this._id);
    }
  }

  get currentStep(): ApprovalStep | undefined {
    return this.props.steps.find((s) => s.stepOrder === this.props.currentStepOrder);
  }

  approveCurrentStep(userId: string, userRoles: string[], comment: string | null, delegatedFrom: string | null): void {
    this.ensureNotCompleted();
    const step = this.currentStep;
    if (!step) throw new WorkflowAlreadyCompletedException(this._id);
    if (!step.isUserAuthorized(userId, userRoles) && !delegatedFrom) {
      throw new UnauthorizedApproverException(userId, step.id);
    }

    step.approve(userId, comment, delegatedFrom);
    this.props.updatedAt = new Date();

    // Advance to next step or mark fully approved
    if (this.props.currentStepOrder < this.props.totalSteps) {
      this.props.currentStepOrder += 1;
      const nextStep = this.currentStep;
      this.addDomainEvent({
        eventId: uuidv4(),
        eventType: 'workflow.approval.needed',
        aggregateId: this._id,
        tenantId: this.props.tenantId,
        occurredAt: new Date(),
        payload: {
          requestedBy: this.props.requestedBy,
          entityType: this.props.entityType,
          entityId: this.props.entityId,
          workflowDefinitionId: this.props.workflowDefinitionId,
          currentStepOrder: this.props.currentStepOrder,
          approverUserIds: nextStep?.approverUserIds ?? [],
          previousStepApprovedBy: userId,
        },
      });
    } else {
      this.props.status = ApprovalStatus.APPROVED;
      this.props.completedAt = new Date();
      this.addDomainEvent({
        eventId: uuidv4(),
        eventType: 'workflow.approval.completed',
        aggregateId: this._id,
        tenantId: this.props.tenantId,
        occurredAt: new Date(),
        payload: {
          entityType: this.props.entityType,
          entityId: this.props.entityId,
          outcome: ApprovalStatus.APPROVED,
          requestedBy: this.props.requestedBy,
          approvedBy: userId,
        },
      });
    }
  }

  rejectCurrentStep(userId: string, userRoles: string[], comment: string | null): void {
    this.ensureNotCompleted();
    const step = this.currentStep;
    if (!step) throw new WorkflowAlreadyCompletedException(this._id);
    if (!step.isUserAuthorized(userId, userRoles)) {
      throw new UnauthorizedApproverException(userId, step.id);
    }

    step.reject(userId, comment);
    this.props.status = ApprovalStatus.REJECTED;
    this.props.completedAt = new Date();
    this.props.updatedAt = new Date();

    this.addDomainEvent({
      eventId: uuidv4(),
      eventType: 'workflow.approval.completed',
      aggregateId: this._id,
      tenantId: this.props.tenantId,
      occurredAt: new Date(),
      payload: {
        entityType: this.props.entityType,
        entityId: this.props.entityId,
        outcome: ApprovalStatus.REJECTED,
        requestedBy: this.props.requestedBy,
        rejectedBy: userId,
        comment,
      },
    });
  }

  escalate(reason: string): void {
    this.ensureNotCompleted();
    this.props.status = ApprovalStatus.ESCALATED;
    this.props.updatedAt = new Date();

    this.addDomainEvent({
      eventId: uuidv4(),
      eventType: 'workflow.approval.needed',
      aggregateId: this._id,
      tenantId: this.props.tenantId,
      occurredAt: new Date(),
      payload: {
        entityType: this.props.entityType,
        entityId: this.props.entityId,
        escalated: true,
        reason,
        currentStepOrder: this.props.currentStepOrder,
        requestedBy: this.props.requestedBy,
      },
    });
  }

  cancel(userId: string): void {
    this.ensureNotCompleted();
    this.props.status = ApprovalStatus.CANCELLED;
    this.props.completedAt = new Date();
    this.props.updatedAt = new Date();

    this.addDomainEvent({
      eventId: uuidv4(),
      eventType: 'workflow.approval.completed',
      aggregateId: this._id,
      tenantId: this.props.tenantId,
      occurredAt: new Date(),
      payload: {
        entityType: this.props.entityType,
        entityId: this.props.entityId,
        outcome: ApprovalStatus.CANCELLED,
        cancelledBy: userId,
      },
    });
  }
}
