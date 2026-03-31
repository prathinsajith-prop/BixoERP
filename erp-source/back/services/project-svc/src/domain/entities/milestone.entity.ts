import { v4 as uuidv4 } from 'uuid';
import { Entity } from './entity.base';

export interface MilestoneProps {
  projectId: string;
  name: string;
  description: string;
  dueDate: Date;
  completedAt: Date | null;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMilestoneInput {
  projectId: string;
  name: string;
  description: string;
  dueDate: Date;
  tenantId: string;
}

export class Milestone extends Entity<MilestoneProps> {
  static create(input: CreateMilestoneInput): Milestone {
    const now = new Date();
    return new Milestone(
      {
        projectId: input.projectId,
        name: input.name,
        description: input.description,
        dueDate: input.dueDate,
        completedAt: null,
        tenantId: input.tenantId,
        createdAt: now,
        updatedAt: now,
      },
      uuidv4(),
    );
  }

  static fromPersistence(props: MilestoneProps, id: string): Milestone {
    return new Milestone(props, id);
  }

  get projectId(): string { return this.props.projectId; }
  get name(): string { return this.props.name; }
  get description(): string { return this.props.description; }
  get dueDate(): Date { return this.props.dueDate; }
  get completedAt(): Date | null { return this.props.completedAt; }
  get tenantId(): string { return this.props.tenantId; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  get isCompleted(): boolean {
    return this.props.completedAt !== null;
  }

  get isOverdue(): boolean {
    return !this.isCompleted && this.props.dueDate < new Date();
  }

  complete(): void {
    if (this.isCompleted) {
      throw new Error('Milestone is already completed');
    }
    this.props.completedAt = new Date();
    this.props.updatedAt = new Date();
  }

  updateDetails(input: { name?: string; description?: string; dueDate?: Date }): void {
    if (this.isCompleted) {
      throw new Error('Cannot update a completed milestone');
    }
    if (input.name !== undefined) this.props.name = input.name;
    if (input.description !== undefined) this.props.description = input.description;
    if (input.dueDate !== undefined) this.props.dueDate = input.dueDate;
    this.props.updatedAt = new Date();
  }
}
