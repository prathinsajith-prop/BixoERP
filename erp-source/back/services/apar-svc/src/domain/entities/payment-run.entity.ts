import { v4 as uuidv4 } from 'uuid';
import { AggregateRoot } from './aggregate-root.base';
import { Money } from '../value-objects/money';

export enum PaymentRunStatus {
  DRAFT = 'DRAFT',
  APPROVED = 'APPROVED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHECK = 'CHECK',
  ACH = 'ACH',
  WIRE = 'WIRE',
}

export interface PaymentRunLineProps {
  id: string;
  vendorInvoiceId: string;
  vendorId: string;
  amount: Money;
  discountAmount: Money;
  netAmount: Money;
  status: 'PENDING' | 'PAID' | 'FAILED';
  failureReason: string | null;
}

export interface PaymentRunProps {
  runNumber: string;
  description: string;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  status: PaymentRunStatus;
  lines: PaymentRunLineProps[];
  totalAmount: Money;
  totalDiscount: Money;
  totalNet: Money;
  currency: string;
  bankAccountId: string;
  tenantId: string;
  createdBy: string;
  approvedBy: string | null;
  approvedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class PaymentRun extends AggregateRoot<PaymentRunProps> {
  static create(
    props: {
      runNumber: string;
      description: string;
      paymentDate: Date;
      paymentMethod: PaymentMethod;
      lines: PaymentRunLineProps[];
      currency: string;
      bankAccountId: string;
      tenantId: string;
      createdBy: string;
    },
    id?: string,
  ): PaymentRun {
    const totalAmount = props.lines.reduce(
      (sum, line) => sum.add(line.amount),
      Money.zero(props.currency),
    );
    const totalDiscount = props.lines.reduce(
      (sum, line) => sum.add(line.discountAmount),
      Money.zero(props.currency),
    );
    const totalNet = props.lines.reduce(
      (sum, line) => sum.add(line.netAmount),
      Money.zero(props.currency),
    );

    if (props.lines.length === 0) {
      throw new Error('Payment run must contain at least one line');
    }

    return new PaymentRun(
      {
        ...props,
        status: PaymentRunStatus.DRAFT,
        totalAmount,
        totalDiscount,
        totalNet,
        approvedBy: null,
        approvedAt: null,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id ?? uuidv4(),
    );
  }

  static fromPersistence(props: PaymentRunProps, id: string): PaymentRun {
    return new PaymentRun(props, id);
  }

  // ── Getters ──────────────────────────────────────────────

  get runNumber(): string {
    return this.props.runNumber;
  }

  get description(): string {
    return this.props.description;
  }

  get paymentDate(): Date {
    return this.props.paymentDate;
  }

  get paymentMethod(): PaymentMethod {
    return this.props.paymentMethod;
  }

  get status(): PaymentRunStatus {
    return this.props.status;
  }

  get lines(): ReadonlyArray<PaymentRunLineProps> {
    return this.props.lines;
  }

  get totalAmount(): Money {
    return this.props.totalAmount;
  }

  get totalDiscount(): Money {
    return this.props.totalDiscount;
  }

  get totalNet(): Money {
    return this.props.totalNet;
  }

  get currency(): string {
    return this.props.currency;
  }

  get bankAccountId(): string {
    return this.props.bankAccountId;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get createdBy(): string {
    return this.props.createdBy;
  }

  get approvedBy(): string | null {
    return this.props.approvedBy;
  }

  get approvedAt(): Date | null {
    return this.props.approvedAt;
  }

  get completedAt(): Date | null {
    return this.props.completedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  // ── Commands ─────────────────────────────────────────────

  /** Approve the payment run for execution */
  approve(approvedBy: string): void {
    if (this.props.status !== PaymentRunStatus.DRAFT) {
      throw new Error(`Cannot approve payment run in status: ${this.props.status}`);
    }
    this.props.status = PaymentRunStatus.APPROVED;
    this.props.approvedBy = approvedBy;
    this.props.approvedAt = new Date();
    this.props.updatedAt = new Date();

    this.addDomainEvent({
      eventId: uuidv4(),
      eventType: 'payment.run.approved',
      aggregateId: this._id,
      tenantId: this.props.tenantId,
      occurredAt: new Date(),
      payload: {
        runNumber: this.props.runNumber,
        totalNet: this.props.totalNet.toString(),
        lineCount: this.props.lines.length,
        approvedBy,
      },
    });
  }

  /** Begin processing the payment run */
  startProcessing(): void {
    if (this.props.status !== PaymentRunStatus.APPROVED) {
      throw new Error(`Cannot process payment run in status: ${this.props.status}`);
    }
    this.props.status = PaymentRunStatus.PROCESSING;
    this.props.updatedAt = new Date();
  }

  /** Mark a single line as paid */
  markLinePaid(lineId: string): void {
    const line = this.props.lines.find((l) => l.id === lineId);
    if (!line) {
      throw new Error(`Payment run line not found: ${lineId}`);
    }
    line.status = 'PAID';
    this.props.updatedAt = new Date();
  }

  /** Mark a single line as failed */
  markLineFailed(lineId: string, reason: string): void {
    const line = this.props.lines.find((l) => l.id === lineId);
    if (!line) {
      throw new Error(`Payment run line not found: ${lineId}`);
    }
    line.status = 'FAILED';
    line.failureReason = reason;
    this.props.updatedAt = new Date();
  }

  /** Complete the payment run */
  complete(): void {
    if (this.props.status !== PaymentRunStatus.PROCESSING) {
      throw new Error(`Cannot complete payment run in status: ${this.props.status}`);
    }

    const allProcessed = this.props.lines.every((l) => l.status === 'PAID' || l.status === 'FAILED');
    if (!allProcessed) {
      throw new Error('Not all payment lines have been processed');
    }

    const anyFailed = this.props.lines.some((l) => l.status === 'FAILED');
    this.props.status = anyFailed ? PaymentRunStatus.FAILED : PaymentRunStatus.COMPLETED;
    this.props.completedAt = new Date();
    this.props.updatedAt = new Date();

    this.addDomainEvent({
      eventId: uuidv4(),
      eventType: 'payment.run.completed',
      aggregateId: this._id,
      tenantId: this.props.tenantId,
      occurredAt: new Date(),
      payload: {
        runNumber: this.props.runNumber,
        status: this.props.status,
        totalPaid: this.props.lines
          .filter((l) => l.status === 'PAID')
          .reduce((sum, l) => sum.add(l.netAmount), Money.zero(this.props.currency))
          .toString(),
        failedCount: this.props.lines.filter((l) => l.status === 'FAILED').length,
      },
    });
  }

  /** Cancel a draft or approved payment run */
  cancel(): void {
    if (
      this.props.status !== PaymentRunStatus.DRAFT &&
      this.props.status !== PaymentRunStatus.APPROVED
    ) {
      throw new Error(`Cannot cancel payment run in status: ${this.props.status}`);
    }
    this.props.status = PaymentRunStatus.CANCELLED;
    this.props.updatedAt = new Date();

    this.addDomainEvent({
      eventId: uuidv4(),
      eventType: 'payment.run.cancelled',
      aggregateId: this._id,
      tenantId: this.props.tenantId,
      occurredAt: new Date(),
      payload: { runNumber: this.props.runNumber },
    });
  }
}
