import { v4 as uuidv4 } from 'uuid';
import { AggregateRoot, DomainEvent } from './aggregate-root.base';
import { ProjectStatus, ProjectStatusEnum } from '../value-objects/project-status';
import { Money } from '../value-objects/money';
import { Task } from './task.entity';
import { Milestone } from './milestone.entity';
import { ProjectBudget } from './project-budget.entity';

export interface ProjectProps {
  code: string;
  name: string;
  description: string;
  status: ProjectStatus;
  managerId: string;
  customerId: string | null;
  startDate: Date;
  endDate: Date | null;
  currency: string;
  tenantId: string;
  tasks: Task[];
  milestones: Milestone[];
  budget: ProjectBudget | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectInput {
  code: string;
  name: string;
  description: string;
  managerId: string;
  customerId?: string | null;
  startDate: Date;
  endDate?: Date | null;
  currency: string;
  tenantId: string;
  createdBy: string;
}

export class Project extends AggregateRoot<ProjectProps> {
  static create(input: CreateProjectInput): Project {
    const now = new Date();
    const id = uuidv4();
    const project = new Project(
      {
        code: input.code,
        name: input.name,
        description: input.description,
        status: ProjectStatus.planning(),
        managerId: input.managerId,
        customerId: input.customerId ?? null,
        startDate: input.startDate,
        endDate: input.endDate ?? null,
        currency: input.currency,
        tenantId: input.tenantId,
        tasks: [],
        milestones: [],
        budget: null,
        createdBy: input.createdBy,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );

    project.addDomainEvent({
      eventId: uuidv4(),
      eventType: 'project.created',
      aggregateId: id,
      tenantId: input.tenantId,
      occurredAt: now,
      payload: {
        code: input.code,
        name: input.name,
        managerId: input.managerId,
        currency: input.currency,
        startDate: input.startDate.toISOString(),
      },
    });

    return project;
  }

  static fromPersistence(props: ProjectProps, id: string): Project {
    return new Project(props, id);
  }

  get code(): string { return this.props.code; }
  get name(): string { return this.props.name; }
  get description(): string { return this.props.description; }
  get status(): ProjectStatusEnum { return this.props.status.value; }
  get statusVO(): ProjectStatus { return this.props.status; }
  get managerId(): string { return this.props.managerId; }
  get customerId(): string | null { return this.props.customerId; }
  get startDate(): Date { return this.props.startDate; }
  get endDate(): Date | null { return this.props.endDate; }
  get currency(): string { return this.props.currency; }
  get tenantId(): string { return this.props.tenantId; }
  get tasks(): ReadonlyArray<Task> { return this.props.tasks; }
  get milestones(): ReadonlyArray<Milestone> { return this.props.milestones; }
  get budget(): ProjectBudget | null { return this.props.budget; }
  get createdBy(): string { return this.props.createdBy; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  updateStatus(newStatus: ProjectStatusEnum): void {
    const updated = this.props.status.transitionTo(newStatus);
    this.props.status = updated;
    this.props.updatedAt = new Date();

    if (newStatus === ProjectStatusEnum.COMPLETED) {
      this.addDomainEvent({
        eventId: uuidv4(),
        eventType: 'project.completed',
        aggregateId: this._id,
        tenantId: this.props.tenantId,
        occurredAt: new Date(),
        payload: {
          code: this.props.code,
          name: this.props.name,
          managerId: this.props.managerId,
          completedAt: new Date().toISOString(),
        },
      });
    }
  }

  updateDetails(input: { name?: string; description?: string; managerId?: string; endDate?: Date | null }): void {
    if (this.props.status.isTerminal()) {
      throw new Error('Cannot update a completed or cancelled project');
    }
    if (input.name !== undefined) this.props.name = input.name;
    if (input.description !== undefined) this.props.description = input.description;
    if (input.managerId !== undefined) this.props.managerId = input.managerId;
    if (input.endDate !== undefined) this.props.endDate = input.endDate;
    this.props.updatedAt = new Date();
  }

  addTask(task: Task): void {
    if (this.props.status.isTerminal()) {
      throw new Error('Cannot add tasks to a completed or cancelled project');
    }
    this.props.tasks.push(task);
    this.props.updatedAt = new Date();
  }

  addMilestone(milestone: Milestone): void {
    if (this.props.status.isTerminal()) {
      throw new Error('Cannot add milestones to a completed or cancelled project');
    }
    this.props.milestones.push(milestone);
    this.props.updatedAt = new Date();
  }

  setBudget(budget: ProjectBudget): void {
    this.props.budget = budget;
    this.props.updatedAt = new Date();
  }

  raiseBudgetExceeded(actualSpend: Money, budgetAmount: Money): void {
    this.addDomainEvent({
      eventId: uuidv4(),
      eventType: 'project.budget.exceeded',
      aggregateId: this._id,
      tenantId: this.props.tenantId,
      occurredAt: new Date(),
      payload: {
        code: this.props.code,
        name: this.props.name,
        budgetAmount: budgetAmount.toString(),
        actualSpend: actualSpend.toString(),
        currency: this.props.currency,
      },
    });
  }
}
