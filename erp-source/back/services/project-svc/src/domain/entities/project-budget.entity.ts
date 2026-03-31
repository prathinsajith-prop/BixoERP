import { v4 as uuidv4 } from 'uuid';
import { Entity } from './entity.base';
import { Money } from '../value-objects/money';

export interface ProjectBudgetProps {
  projectId: string;
  totalBudget: Money;
  laborBudget: Money;
  materialBudget: Money;
  actualLaborCost: Money;
  actualMaterialCost: Money;
  currency: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectBudgetInput {
  projectId: string;
  totalBudget: number;
  laborBudget: number;
  materialBudget: number;
  currency: string;
  tenantId: string;
}

export class ProjectBudget extends Entity<ProjectBudgetProps> {
  static create(input: CreateProjectBudgetInput): ProjectBudget {
    const now = new Date();
    return new ProjectBudget(
      {
        projectId: input.projectId,
        totalBudget: Money.create(input.totalBudget, input.currency),
        laborBudget: Money.create(input.laborBudget, input.currency),
        materialBudget: Money.create(input.materialBudget, input.currency),
        actualLaborCost: Money.zero(input.currency),
        actualMaterialCost: Money.zero(input.currency),
        currency: input.currency,
        tenantId: input.tenantId,
        createdAt: now,
        updatedAt: now,
      },
      uuidv4(),
    );
  }

  static fromPersistence(props: ProjectBudgetProps, id: string): ProjectBudget {
    return new ProjectBudget(props, id);
  }

  get projectId(): string { return this.props.projectId; }
  get totalBudget(): Money { return this.props.totalBudget; }
  get laborBudget(): Money { return this.props.laborBudget; }
  get materialBudget(): Money { return this.props.materialBudget; }
  get actualLaborCost(): Money { return this.props.actualLaborCost; }
  get actualMaterialCost(): Money { return this.props.actualMaterialCost; }
  get currency(): string { return this.props.currency; }
  get tenantId(): string { return this.props.tenantId; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  get totalActualCost(): Money {
    return this.props.actualLaborCost.add(this.props.actualMaterialCost);
  }

  get totalVariance(): Money {
    return this.props.totalBudget.subtract(this.totalActualCost);
  }

  get laborVariance(): Money {
    return this.props.laborBudget.subtract(this.props.actualLaborCost);
  }

  get materialVariance(): Money {
    return this.props.materialBudget.subtract(this.props.actualMaterialCost);
  }

  get isBudgetExceeded(): boolean {
    return this.totalActualCost.greaterThan(this.props.totalBudget);
  }

  addLaborCost(cost: Money): void {
    this.props.actualLaborCost = this.props.actualLaborCost.add(cost);
    this.props.updatedAt = new Date();
  }

  addMaterialCost(cost: Money): void {
    this.props.actualMaterialCost = this.props.actualMaterialCost.add(cost);
    this.props.updatedAt = new Date();
  }

  updateBudget(input: { totalBudget?: number; laborBudget?: number; materialBudget?: number }): void {
    if (input.totalBudget !== undefined) {
      this.props.totalBudget = Money.create(input.totalBudget, this.props.currency);
    }
    if (input.laborBudget !== undefined) {
      this.props.laborBudget = Money.create(input.laborBudget, this.props.currency);
    }
    if (input.materialBudget !== undefined) {
      this.props.materialBudget = Money.create(input.materialBudget, this.props.currency);
    }
    this.props.updatedAt = new Date();
  }
}
