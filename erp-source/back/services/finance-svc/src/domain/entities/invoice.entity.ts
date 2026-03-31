import { v4 as uuidv4 } from 'uuid';
import { AggregateRoot } from './aggregate-root.base';
import { Money } from '../value-objects/money';

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  VOID = 'VOID',
  WRITTEN_OFF = 'WRITTEN_OFF',
}

export interface InvoiceLineProps {
  id: string;
  description: string;
  quantity: number;
  unitPrice: Money;
  taxCode: string | null;
  taxAmount: Money;
  lineTotal: Money;
  accountId: string;
}

export interface InvoiceProps {
  invoiceNumber: string;
  customerId: string;
  issueDate: Date;
  dueDate: Date;
  status: InvoiceStatus;
  lines: InvoiceLineProps[];
  subtotal: Money;
  taxTotal: Money;
  total: Money;
  amountPaid: Money;
  currency: string;
  tenantId: string;
  notes: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Invoice extends AggregateRoot<InvoiceProps> {
  static create(
    props: {
      invoiceNumber: string;
      customerId: string;
      issueDate: Date;
      dueDate: Date;
      lines: InvoiceLineProps[];
      currency: string;
      tenantId: string;
      notes: string | null;
      createdBy: string;
    },
    id?: string,
  ): Invoice {
    const subtotal = props.lines.reduce(
      (sum, line) => sum.add(line.lineTotal),
      Money.zero(props.currency),
    );
    const taxTotal = props.lines.reduce(
      (sum, line) => sum.add(line.taxAmount),
      Money.zero(props.currency),
    );

    return new Invoice(
      {
        ...props,
        status: InvoiceStatus.DRAFT,
        subtotal,
        taxTotal,
        total: subtotal.add(taxTotal),
        amountPaid: Money.zero(props.currency),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id ?? uuidv4(),
    );
  }

  static fromPersistence(props: InvoiceProps, id: string): Invoice {
    return new Invoice(props, id);
  }

  get invoiceNumber(): string {
    return this.props.invoiceNumber;
  }

  get customerId(): string {
    return this.props.customerId;
  }

  get status(): InvoiceStatus {
    return this.props.status;
  }

  get total(): Money {
    return this.props.total;
  }

  get amountPaid(): Money {
    return this.props.amountPaid;
  }

  get balance(): Money {
    return this.props.total.subtract(this.props.amountPaid);
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get dueDate(): Date {
    return this.props.dueDate;
  }

  get isOverdue(): boolean {
    return (
      this.props.status !== InvoiceStatus.PAID &&
      this.props.status !== InvoiceStatus.VOID &&
      this.props.dueDate < new Date()
    );
  }

  send(): void {
    if (this.props.status !== InvoiceStatus.DRAFT) {
      throw new Error(`Cannot send invoice in status: ${this.props.status}`);
    }
    this.props.status = InvoiceStatus.SENT;
    this.props.updatedAt = new Date();

    this.addDomainEvent({
      eventId: uuidv4(),
      eventType: 'invoice.sent',
      aggregateId: this._id,
      tenantId: this.props.tenantId,
      occurredAt: new Date(),
      payload: {
        invoiceNumber: this.props.invoiceNumber,
        customerId: this.props.customerId,
        total: this.props.total.toString(),
      },
    });
  }

  applyPayment(amount: Money): void {
    if (
      this.props.status === InvoiceStatus.VOID ||
      this.props.status === InvoiceStatus.PAID
    ) {
      throw new Error(`Cannot apply payment to invoice in status: ${this.props.status}`);
    }

    this.props.amountPaid = this.props.amountPaid.add(amount);
    this.props.updatedAt = new Date();

    if (this.props.amountPaid.amountAsNumber >= this.props.total.amountAsNumber) {
      this.props.status = InvoiceStatus.PAID;
      this.addDomainEvent({
        eventId: uuidv4(),
        eventType: 'invoice.paid',
        aggregateId: this._id,
        tenantId: this.props.tenantId,
        occurredAt: new Date(),
        payload: {
          invoiceNumber: this.props.invoiceNumber,
          customerId: this.props.customerId,
          total: this.props.total.toString(),
        },
      });
    } else {
      this.props.status = InvoiceStatus.PARTIALLY_PAID;
    }
  }

  void(): void {
    if (this.props.status === InvoiceStatus.PAID) {
      throw new Error('Cannot void a paid invoice');
    }
    this.props.status = InvoiceStatus.VOID;
    this.props.updatedAt = new Date();
  }

  /** Aging bucket (30/60/90 days) */
  get agingDays(): number {
    if (this.props.status === InvoiceStatus.PAID || this.props.status === InvoiceStatus.VOID) {
      return 0;
    }
    const now = new Date();
    const diff = now.getTime() - this.props.dueDate.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }

  get agingBucket(): string {
    const days = this.agingDays;
    if (days === 0) return 'CURRENT';
    if (days <= 30) return '1-30';
    if (days <= 60) return '31-60';
    if (days <= 90) return '61-90';
    return '90+';
  }
}
