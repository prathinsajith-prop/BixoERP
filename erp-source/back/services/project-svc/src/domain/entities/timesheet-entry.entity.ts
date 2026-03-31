import { v4 as uuidv4 } from 'uuid';
import { Entity } from './entity.base';

export interface TimesheetEntryProps {
  projectId: string;
  taskId: string | null;
  employeeId: string;
  date: Date;
  hours: number;
  description: string;
  billable: boolean;
  approved: boolean;
  approvedBy: string | null;
  approvedAt: Date | null;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTimesheetEntryInput {
  projectId: string;
  taskId?: string | null;
  employeeId: string;
  date: Date;
  hours: number;
  description: string;
  billable?: boolean;
  tenantId: string;
}

export class TimesheetEntry extends Entity<TimesheetEntryProps> {
  static create(input: CreateTimesheetEntryInput): TimesheetEntry {
    if (input.hours <= 0 || input.hours > 24) {
      throw new Error('Hours must be between 0 and 24');
    }
    const now = new Date();
    return new TimesheetEntry(
      {
        projectId: input.projectId,
        taskId: input.taskId ?? null,
        employeeId: input.employeeId,
        date: input.date,
        hours: input.hours,
        description: input.description,
        billable: input.billable ?? true,
        approved: false,
        approvedBy: null,
        approvedAt: null,
        tenantId: input.tenantId,
        createdAt: now,
        updatedAt: now,
      },
      uuidv4(),
    );
  }

  static fromPersistence(props: TimesheetEntryProps, id: string): TimesheetEntry {
    return new TimesheetEntry(props, id);
  }

  get projectId(): string { return this.props.projectId; }
  get taskId(): string | null { return this.props.taskId; }
  get employeeId(): string { return this.props.employeeId; }
  get date(): Date { return this.props.date; }
  get hours(): number { return this.props.hours; }
  get description(): string { return this.props.description; }
  get billable(): boolean { return this.props.billable; }
  get approved(): boolean { return this.props.approved; }
  get approvedBy(): string | null { return this.props.approvedBy; }
  get approvedAt(): Date | null { return this.props.approvedAt; }
  get tenantId(): string { return this.props.tenantId; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  approve(approvedBy: string): void {
    if (this.props.approved) {
      throw new Error('Timesheet entry is already approved');
    }
    this.props.approved = true;
    this.props.approvedBy = approvedBy;
    this.props.approvedAt = new Date();
    this.props.updatedAt = new Date();
  }

  reject(): void {
    this.props.approved = false;
    this.props.approvedBy = null;
    this.props.approvedAt = null;
    this.props.updatedAt = new Date();
  }

  updateHours(hours: number): void {
    if (this.props.approved) {
      throw new Error('Cannot update hours on an approved timesheet entry');
    }
    if (hours <= 0 || hours > 24) {
      throw new Error('Hours must be between 0 and 24');
    }
    this.props.hours = hours;
    this.props.updatedAt = new Date();
  }
}
