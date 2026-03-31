import { v4 as uuidv4 } from 'uuid';
import { AggregateRoot, DomainEvent } from './aggregate-root.base';
import { Money } from '../value-objects/money';
import { BusinessRuleViolation } from '../exceptions/domain.exceptions';

export enum PayrollRunStatus {
  DRAFT = 'DRAFT',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface PayrollLineProps {
  id: string;
  employeeId: string;
  baseSalary: Money;
  allowances: Money;
  deductions: Money;
  taxAmount: Money;
  netPay: Money;
  currency: string;
}

export interface PayrollRunProps {
  runNumber: string;
  periodYear: number;
  periodMonth: number;
  status: PayrollRunStatus;
  lines: PayrollLineProps[];
  totalGross: Money;
  totalDeductions: Money;
  totalNet: Money;
  currency: string;
  tenantId: string;
  createdBy: string;
  processedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class PayrollRun extends AggregateRoot<PayrollRunProps> {
  /** Invariant: Payroll cannot run for future periods */
  static create(
    props: {
      runNumber: string;
      periodYear: number;
      periodMonth: number;
      lines: PayrollLineProps[];
      currency: string;
      tenantId: string;
      createdBy: string;
    },
    id?: string,
  ): PayrollRun {
    // Validate period is not in the future
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    if (
      props.periodYear > currentYear ||
      (props.periodYear === currentYear && props.periodMonth > currentMonth)
    ) {
      throw new BusinessRuleViolation(
        `Payroll cannot run for future period: ${props.periodYear}-${String(props.periodMonth).padStart(2, '0')}`,
      );
    }

    const totalGross = props.lines.reduce(
      (sum, line) => sum.add(line.baseSalary).add(line.allowances),
      Money.zero(props.currency),
    );
    const totalDeductions = props.lines.reduce(
      (sum, line) => sum.add(line.deductions).add(line.taxAmount),
      Money.zero(props.currency),
    );
    const totalNet = props.lines.reduce(
      (sum, line) => sum.add(line.netPay),
      Money.zero(props.currency),
    );

    return new PayrollRun(
      {
        ...props,
        status: PayrollRunStatus.DRAFT,
        totalGross,
        totalDeductions,
        totalNet,
        processedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id ?? uuidv4(),
    );
  }

  static fromPersistence(props: PayrollRunProps, id: string): PayrollRun {
    return new PayrollRun(props, id);
  }

  get runNumber(): string {
    return this.props.runNumber;
  }

  get periodYear(): number {
    return this.props.periodYear;
  }

  get periodMonth(): number {
    return this.props.periodMonth;
  }

  get periodLabel(): string {
    return `${this.props.periodYear}-${String(this.props.periodMonth).padStart(2, '0')}`;
  }

  get status(): PayrollRunStatus {
    return this.props.status;
  }

  get lines(): ReadonlyArray<PayrollLineProps> {
    return this.props.lines;
  }

  get totalGross(): Money {
    return this.props.totalGross;
  }

  get totalDeductions(): Money {
    return this.props.totalDeductions;
  }

  get totalNet(): Money {
    return this.props.totalNet;
  }

  get currency(): string {
    return this.props.currency;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get createdBy(): string {
    return this.props.createdBy;
  }

  get processedAt(): Date | null {
    return this.props.processedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  process(): void {
    if (this.props.status !== PayrollRunStatus.DRAFT) {
      throw new BusinessRuleViolation(`Cannot process payroll run in status: ${this.props.status}`);
    }

    this.props.status = PayrollRunStatus.COMPLETED;
    this.props.processedAt = new Date();
    this.props.updatedAt = new Date();

    this.addDomainEvent({
      eventId: uuidv4(),
      eventType: 'payroll.processed',
      aggregateId: this.id,
      tenantId: this.props.tenantId,
      occurredAt: new Date(),
      payload: {
        runNumber: this.props.runNumber,
        periodYear: this.props.periodYear,
        periodMonth: this.props.periodMonth,
        totalGross: this.props.totalGross.amount,
        totalDeductions: this.props.totalDeductions.amount,
        totalNet: this.props.totalNet.amount,
        currency: this.props.currency,
        employeeCount: this.props.lines.length,
      },
    });
  }

  cancel(): void {
    if (this.props.status !== PayrollRunStatus.DRAFT) {
      throw new BusinessRuleViolation(`Cannot cancel payroll run in status: ${this.props.status}`);
    }
    this.props.status = PayrollRunStatus.CANCELLED;
    this.props.updatedAt = new Date();
  }

  markFailed(reason: string): void {
    this.props.status = PayrollRunStatus.FAILED;
    this.props.updatedAt = new Date();
  }
}
