import { v4 as uuidv4 } from 'uuid';
import { AggregateRoot } from './aggregate-root.base';
import { Money } from '../value-objects/money';

export enum BudgetStatus {
  DRAFT = 'DRAFT',
  APPROVED = 'APPROVED',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
}

export interface BudgetLineProps {
  id: string;
  accountId: string;
  period: string; // YYYY-MM
  amount: Money;
  actual: Money;
}

export interface BudgetProps {
  name: string;
  fiscalYear: number;
  status: BudgetStatus;
  lines: BudgetLineProps[];
  tenantId: string;
  createdBy: string;
  approvedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Budget extends AggregateRoot<BudgetProps> {
  static create(
    props: {
      name: string;
      fiscalYear: number;
      lines: BudgetLineProps[];
      tenantId: string;
      createdBy: string;
    },
    id?: string,
  ): Budget {
    return new Budget(
      {
        ...props,
        status: BudgetStatus.DRAFT,
        approvedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id ?? uuidv4(),
    );
  }

  static fromPersistence(props: BudgetProps, id: string): Budget {
    return new Budget(props, id);
  }

  get name(): string {
    return this.props.name;
  }

  get fiscalYear(): number {
    return this.props.fiscalYear;
  }

  get status(): BudgetStatus {
    return this.props.status;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get lines(): ReadonlyArray<BudgetLineProps> {
    return this.props.lines;
  }

  approve(approvedBy: string): void {
    if (this.props.status !== BudgetStatus.DRAFT) {
      throw new Error(`Cannot approve budget in status: ${this.props.status}`);
    }
    this.props.status = BudgetStatus.APPROVED;
    this.props.approvedBy = approvedBy;
    this.props.updatedAt = new Date();
  }

  activate(): void {
    if (this.props.status !== BudgetStatus.APPROVED) {
      throw new Error(`Cannot activate budget in status: ${this.props.status}`);
    }
    this.props.status = BudgetStatus.ACTIVE;
    this.props.updatedAt = new Date();
  }

  /** Check if a spend exceeds the budget for a given account/period */
  checkOverBudget(accountId: string, period: string, spendAmount: Money): boolean {
    const line = this.props.lines.find(
      (l) => l.accountId === accountId && l.period === period,
    );
    if (!line) return false;

    const projected = line.actual.add(spendAmount);
    return projected.amountAsNumber > line.amount.amountAsNumber;
  }

  /** Get variance (budget - actual) for a line */
  getVariance(accountId: string, period: string): Money | null {
    const line = this.props.lines.find(
      (l) => l.accountId === accountId && l.period === period,
    );
    if (!line) return null;
    return line.amount.subtract(line.actual);
  }
}
