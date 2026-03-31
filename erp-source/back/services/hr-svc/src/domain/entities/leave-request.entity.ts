import { v4 as uuidv4 } from 'uuid';
import { Entity } from './entity.base';
import { BusinessRuleViolation } from '../exceptions/domain.exceptions';

export enum LeaveType {
  ANNUAL = 'ANNUAL',
  SICK = 'SICK',
  MATERNITY = 'MATERNITY',
  PATERNITY = 'PATERNITY',
  UNPAID = 'UNPAID',
  BEREAVEMENT = 'BEREAVEMENT',
  OTHER = 'OTHER',
}

export enum LeaveRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export interface LeaveRequestProps {
  employeeId: string;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string | null;
  status: LeaveRequestStatus;
  approvedBy: string | null;
  rejectionReason: string | null;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class LeaveRequest extends Entity<LeaveRequestProps> {
  static create(
    props: {
      employeeId: string;
      leaveType: LeaveType;
      startDate: Date;
      endDate: Date;
      totalDays: number;
      reason: string | null;
      tenantId: string;
    },
    id?: string,
  ): LeaveRequest {
    if (props.endDate < props.startDate) {
      throw new BusinessRuleViolation('Leave end date cannot be before start date');
    }
    if (props.totalDays <= 0) {
      throw new BusinessRuleViolation('Leave total days must be positive');
    }

    return new LeaveRequest(
      {
        ...props,
        status: LeaveRequestStatus.PENDING,
        approvedBy: null,
        rejectionReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id,
    );
  }

  static fromPersistence(props: LeaveRequestProps, id: string): LeaveRequest {
    return new LeaveRequest(props, id);
  }

  get employeeId(): string {
    return this.props.employeeId;
  }

  get leaveType(): LeaveType {
    return this.props.leaveType;
  }

  get startDate(): Date {
    return this.props.startDate;
  }

  get endDate(): Date {
    return this.props.endDate;
  }

  get totalDays(): number {
    return this.props.totalDays;
  }

  get reason(): string | null {
    return this.props.reason;
  }

  get status(): LeaveRequestStatus {
    return this.props.status;
  }

  get approvedBy(): string | null {
    return this.props.approvedBy;
  }

  get rejectionReason(): string | null {
    return this.props.rejectionReason;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  approve(approvedBy: string): void {
    if (this.props.status !== LeaveRequestStatus.PENDING) {
      throw new BusinessRuleViolation(`Cannot approve leave request in status: ${this.props.status}`);
    }
    this.props.status = LeaveRequestStatus.APPROVED;
    this.props.approvedBy = approvedBy;
    this.props.updatedAt = new Date();
  }

  reject(rejectedBy: string, rejectionReason: string): void {
    if (this.props.status !== LeaveRequestStatus.PENDING) {
      throw new BusinessRuleViolation(`Cannot reject leave request in status: ${this.props.status}`);
    }
    this.props.status = LeaveRequestStatus.REJECTED;
    this.props.approvedBy = rejectedBy;
    this.props.rejectionReason = rejectionReason;
    this.props.updatedAt = new Date();
  }

  cancel(): void {
    if (
      this.props.status !== LeaveRequestStatus.PENDING &&
      this.props.status !== LeaveRequestStatus.APPROVED
    ) {
      throw new BusinessRuleViolation(`Cannot cancel leave request in status: ${this.props.status}`);
    }
    this.props.status = LeaveRequestStatus.CANCELLED;
    this.props.updatedAt = new Date();
  }
}
