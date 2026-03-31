import { v4 as uuidv4 } from 'uuid';
import { ApprovalStatus } from '../value-objects/approval-status';
import { StepAlreadyProcessedException, UnauthorizedApproverException } from '../exceptions/domain.exceptions';

export enum ApprovalStepStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SKIPPED = 'SKIPPED',
}

export interface ApprovalStepProps {
  requestId: string;
  stepOrder: number;
  stepName: string;
  approverUserIds: string[];
  approverRoleIds: string[];
  status: ApprovalStepStatus;
  decidedBy: string | null;
  decidedAt: Date | null;
  comment: string | null;
  delegatedFrom: string | null;
  createdAt: Date;
}

export class ApprovalStep {
  private readonly _id: string;
  private props: ApprovalStepProps;

  constructor(props: ApprovalStepProps, id: string) {
    this._id = id;
    this.props = props;
  }

  get id(): string { return this._id; }
  get requestId(): string { return this.props.requestId; }
  get stepOrder(): number { return this.props.stepOrder; }
  get stepName(): string { return this.props.stepName; }
  get approverUserIds(): string[] { return this.props.approverUserIds; }
  get approverRoleIds(): string[] { return this.props.approverRoleIds; }
  get status(): ApprovalStepStatus { return this.props.status; }
  get decidedBy(): string | null { return this.props.decidedBy; }
  get decidedAt(): Date | null { return this.props.decidedAt; }
  get comment(): string | null { return this.props.comment; }
  get delegatedFrom(): string | null { return this.props.delegatedFrom; }
  get createdAt(): Date { return this.props.createdAt; }

  get isPending(): boolean { return this.props.status === ApprovalStepStatus.PENDING; }

  static create(params: {
    requestId: string;
    stepOrder: number;
    stepName: string;
    approverUserIds: string[];
    approverRoleIds: string[];
  }): ApprovalStep {
    const id = uuidv4();
    return new ApprovalStep(
      {
        requestId: params.requestId,
        stepOrder: params.stepOrder,
        stepName: params.stepName,
        approverUserIds: params.approverUserIds,
        approverRoleIds: params.approverRoleIds,
        status: ApprovalStepStatus.PENDING,
        decidedBy: null,
        decidedAt: null,
        comment: null,
        delegatedFrom: null,
        createdAt: new Date(),
      },
      id,
    );
  }

  static reconstitute(id: string, props: ApprovalStepProps): ApprovalStep {
    return new ApprovalStep(props, id);
  }

  approve(userId: string, comment: string | null, delegatedFrom: string | null): void {
    if (!this.isPending) {
      throw new StepAlreadyProcessedException(this._id);
    }
    this.props.status = ApprovalStepStatus.APPROVED;
    this.props.decidedBy = userId;
    this.props.decidedAt = new Date();
    this.props.comment = comment;
    this.props.delegatedFrom = delegatedFrom;
  }

  reject(userId: string, comment: string | null): void {
    if (!this.isPending) {
      throw new StepAlreadyProcessedException(this._id);
    }
    this.props.status = ApprovalStepStatus.REJECTED;
    this.props.decidedBy = userId;
    this.props.decidedAt = new Date();
    this.props.comment = comment;
  }

  skip(): void {
    if (!this.isPending) {
      throw new StepAlreadyProcessedException(this._id);
    }
    this.props.status = ApprovalStepStatus.SKIPPED;
    this.props.decidedAt = new Date();
  }

  isUserAuthorized(userId: string, userRoles: string[]): boolean {
    if (this.props.approverUserIds.includes(userId)) return true;
    return this.props.approverRoleIds.some((role) => userRoles.includes(role));
  }
}
