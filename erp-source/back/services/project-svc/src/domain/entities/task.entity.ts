import { v4 as uuidv4 } from 'uuid';
import { Entity } from './entity.base';
import { TaskStatus, TaskStatusEnum } from '../value-objects/task-status';

export interface TaskProps {
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  assigneeId: string | null;
  milestoneId: string | null;
  priority: number;
  estimatedHours: number;
  actualHours: number;
  dueDate: Date | null;
  tenantId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskInput {
  projectId: string;
  title: string;
  description: string;
  assigneeId?: string | null;
  milestoneId?: string | null;
  priority?: number;
  estimatedHours?: number;
  dueDate?: Date | null;
  tenantId: string;
  createdBy: string;
}

export class Task extends Entity<TaskProps> {
  static create(input: CreateTaskInput): Task {
    const now = new Date();
    return new Task(
      {
        projectId: input.projectId,
        title: input.title,
        description: input.description,
        status: TaskStatus.todo(),
        assigneeId: input.assigneeId ?? null,
        milestoneId: input.milestoneId ?? null,
        priority: input.priority ?? 0,
        estimatedHours: input.estimatedHours ?? 0,
        actualHours: 0,
        dueDate: input.dueDate ?? null,
        tenantId: input.tenantId,
        createdBy: input.createdBy,
        createdAt: now,
        updatedAt: now,
      },
      uuidv4(),
    );
  }

  static fromPersistence(props: TaskProps, id: string): Task {
    return new Task(props, id);
  }

  get projectId(): string { return this.props.projectId; }
  get title(): string { return this.props.title; }
  get description(): string { return this.props.description; }
  get status(): TaskStatusEnum { return this.props.status.value; }
  get statusVO(): TaskStatus { return this.props.status; }
  get assigneeId(): string | null { return this.props.assigneeId; }
  get milestoneId(): string | null { return this.props.milestoneId; }
  get priority(): number { return this.props.priority; }
  get estimatedHours(): number { return this.props.estimatedHours; }
  get actualHours(): number { return this.props.actualHours; }
  get dueDate(): Date | null { return this.props.dueDate; }
  get tenantId(): string { return this.props.tenantId; }
  get createdBy(): string { return this.props.createdBy; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  updateStatus(newStatus: TaskStatusEnum): void {
    this.props.status = this.props.status.transitionTo(newStatus);
    this.props.updatedAt = new Date();
  }

  assign(assigneeId: string): void {
    this.props.assigneeId = assigneeId;
    this.props.updatedAt = new Date();
  }

  logHours(hours: number): void {
    if (hours <= 0) throw new Error('Hours must be positive');
    this.props.actualHours += hours;
    this.props.updatedAt = new Date();
  }

  updateDetails(input: { title?: string; description?: string; priority?: number; estimatedHours?: number; dueDate?: Date | null }): void {
    if (this.props.status.isTerminal()) {
      throw new Error('Cannot update a completed or cancelled task');
    }
    if (input.title !== undefined) this.props.title = input.title;
    if (input.description !== undefined) this.props.description = input.description;
    if (input.priority !== undefined) this.props.priority = input.priority;
    if (input.estimatedHours !== undefined) this.props.estimatedHours = input.estimatedHours;
    if (input.dueDate !== undefined) this.props.dueDate = input.dueDate;
    this.props.updatedAt = new Date();
  }
}
