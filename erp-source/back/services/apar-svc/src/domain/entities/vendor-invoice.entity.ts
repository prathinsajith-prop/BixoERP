import { v4 as uuidv4 } from 'uuid';
import { AggregateRoot } from './aggregate-root.base';
import { Money } from '../value-objects/money';
import { PaymentTerms } from '../value-objects/payment-terms';

export enum VendorInvoiceStatus {
  DRAFT = 'DRAFT',
  PENDING_MATCH = 'PENDING_MATCH',
  MATCHED = 'MATCHED',
  APPROVED = 'APPROVED',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  VOID = 'VOID',
  DISPUTED = 'DISPUTED',
}

export interface VendorInvoiceLineProps {
  id: string;
  description: string;
  quantity: number;
  unitPrice: Money;
  taxCode: string | null;
  taxAmount: Money;
  lineTotal: Money;
  accountId: string;
  purchaseOrderLineId: string | null;
}

export interface ThreeWayMatchResult {
  poMatched: boolean;
  receiptMatched: boolean;
  invoiceMatched: boolean;
  poNumber: string | null;
  receiptNumber: string | null;
  varianceAmount: Money | null;
}

export interface VendorInvoiceProps {
  invoiceNumber: string;
  vendorId: string;
  vendorInvoiceRef: string;
  issueDate: Date;
  dueDate: Date;
  status: VendorInvoiceStatus;
  lines: VendorInvoiceLineProps[];
  subtotal: Money;
  taxTotal: Money;
  total: Money;
  amountPaid: Money;
  currency: string;
  paymentTerms: PaymentTerms;
  purchaseOrderId: string | null;
  goodsReceiptId: string | null;
  threeWayMatch: ThreeWayMatchResult | null;
  tenantId: string;
  notes: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class VendorInvoice extends AggregateRoot<VendorInvoiceProps> {
  static create(
    props: {
      invoiceNumber: string;
      vendorId: string;
      vendorInvoiceRef: string;
      issueDate: Date;
      dueDate: Date;
      lines: VendorInvoiceLineProps[];
      currency: string;
      paymentTermsCode: string;
      purchaseOrderId: string | null;
      goodsReceiptId: string | null;
      tenantId: string;
      notes: string | null;
      createdBy: string;
    },
    id?: string,
  ): VendorInvoice {
    const subtotal = props.lines.reduce(
      (sum, line) => sum.add(line.lineTotal),
      Money.zero(props.currency),
    );
    const taxTotal = props.lines.reduce(
      (sum, line) => sum.add(line.taxAmount),
      Money.zero(props.currency),
    );
    const paymentTerms = PaymentTerms.fromCode(props.paymentTermsCode);

    return new VendorInvoice(
      {
        invoiceNumber: props.invoiceNumber,
        vendorId: props.vendorId,
        vendorInvoiceRef: props.vendorInvoiceRef,
        issueDate: props.issueDate,
        dueDate: props.dueDate,
        status: VendorInvoiceStatus.DRAFT,
        lines: props.lines,
        subtotal,
        taxTotal,
        total: subtotal.add(taxTotal),
        amountPaid: Money.zero(props.currency),
        currency: props.currency,
        paymentTerms,
        purchaseOrderId: props.purchaseOrderId,
        goodsReceiptId: props.goodsReceiptId,
        threeWayMatch: null,
        tenantId: props.tenantId,
        notes: props.notes,
        createdBy: props.createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id ?? uuidv4(),
    );
  }

  static fromPersistence(props: VendorInvoiceProps, id: string): VendorInvoice {
    return new VendorInvoice(props, id);
  }

  // ── Getters ──────────────────────────────────────────────

  get invoiceNumber(): string {
    return this.props.invoiceNumber;
  }

  get vendorId(): string {
    return this.props.vendorId;
  }

  get vendorInvoiceRef(): string {
    return this.props.vendorInvoiceRef;
  }

  get status(): VendorInvoiceStatus {
    return this.props.status;
  }

  get total(): Money {
    return this.props.total;
  }

  get subtotal(): Money {
    return this.props.subtotal;
  }

  get taxTotal(): Money {
    return this.props.taxTotal;
  }

  get amountPaid(): Money {
    return this.props.amountPaid;
  }

  get balance(): Money {
    return this.props.total.subtract(this.props.amountPaid);
  }

  get currency(): string {
    return this.props.currency;
  }

  get paymentTerms(): PaymentTerms {
    return this.props.paymentTerms;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get issueDate(): Date {
    return this.props.issueDate;
  }

  get dueDate(): Date {
    return this.props.dueDate;
  }

  get purchaseOrderId(): string | null {
    return this.props.purchaseOrderId;
  }

  get goodsReceiptId(): string | null {
    return this.props.goodsReceiptId;
  }

  get threeWayMatch(): ThreeWayMatchResult | null {
    return this.props.threeWayMatch;
  }

  get lines(): ReadonlyArray<VendorInvoiceLineProps> {
    return this.props.lines;
  }

  get notes(): string | null {
    return this.props.notes;
  }

  get createdBy(): string {
    return this.props.createdBy;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get isOverdue(): boolean {
    return (
      this.props.status !== VendorInvoiceStatus.PAID &&
      this.props.status !== VendorInvoiceStatus.VOID &&
      this.props.dueDate < new Date()
    );
  }

  // ── Aging bucket ─────────────────────────────────────────

  get agingDays(): number {
    if (this.props.status === VendorInvoiceStatus.PAID || this.props.status === VendorInvoiceStatus.VOID) {
      return 0;
    }
    const now = new Date();
    const diff = now.getTime() - this.props.dueDate.getTime();
    return diff > 0 ? Math.floor(diff / (1000 * 60 * 60 * 24)) : 0;
  }

  get agingBucket(): 'CURRENT' | '1-30' | '31-60' | '61-90' | '90+' {
    const days = this.agingDays;
    if (days === 0) return 'CURRENT';
    if (days <= 30) return '1-30';
    if (days <= 60) return '31-60';
    if (days <= 90) return '61-90';
    return '90+';
  }

  // ── Commands ─────────────────────────────────────────────

  /** Submit for 3-way matching */
  submitForMatch(): void {
    if (this.props.status !== VendorInvoiceStatus.DRAFT) {
      throw new Error(`Cannot submit invoice in status: ${this.props.status}`);
    }
    if (!this.props.purchaseOrderId) {
      throw new Error('Cannot submit for 3-way match without a purchase order reference');
    }
    this.props.status = VendorInvoiceStatus.PENDING_MATCH;
    this.props.updatedAt = new Date();

    this.addDomainEvent({
      eventId: uuidv4(),
      eventType: 'vendor.invoice.submitted_for_match',
      aggregateId: this._id,
      tenantId: this.props.tenantId,
      occurredAt: new Date(),
      payload: {
        invoiceNumber: this.props.invoiceNumber,
        vendorId: this.props.vendorId,
        purchaseOrderId: this.props.purchaseOrderId,
        total: this.props.total.toString(),
      },
    });
  }

  /** Record the result of a 3-way match */
  recordMatchResult(result: ThreeWayMatchResult): void {
    if (this.props.status !== VendorInvoiceStatus.PENDING_MATCH) {
      throw new Error(`Cannot record match in status: ${this.props.status}`);
    }
    this.props.threeWayMatch = result;

    if (result.poMatched && result.receiptMatched && result.invoiceMatched) {
      this.props.status = VendorInvoiceStatus.MATCHED;
      this.addDomainEvent({
        eventId: uuidv4(),
        eventType: 'vendor.invoice.matched',
        aggregateId: this._id,
        tenantId: this.props.tenantId,
        occurredAt: new Date(),
        payload: {
          invoiceNumber: this.props.invoiceNumber,
          poNumber: result.poNumber,
          receiptNumber: result.receiptNumber,
        },
      });
    } else {
      this.props.status = VendorInvoiceStatus.DISPUTED;
      this.addDomainEvent({
        eventId: uuidv4(),
        eventType: 'vendor.invoice.match_failed',
        aggregateId: this._id,
        tenantId: this.props.tenantId,
        occurredAt: new Date(),
        payload: {
          invoiceNumber: this.props.invoiceNumber,
          poMatched: result.poMatched,
          receiptMatched: result.receiptMatched,
          varianceAmount: result.varianceAmount?.toString() ?? null,
        },
      });
    }
    this.props.updatedAt = new Date();
  }

  /** Approve the invoice for payment */
  approve(): void {
    const allowedStatuses = [VendorInvoiceStatus.MATCHED, VendorInvoiceStatus.DRAFT];
    if (!allowedStatuses.includes(this.props.status)) {
      throw new Error(`Cannot approve invoice in status: ${this.props.status}`);
    }
    this.props.status = VendorInvoiceStatus.APPROVED;
    this.props.updatedAt = new Date();

    this.addDomainEvent({
      eventId: uuidv4(),
      eventType: 'vendor.invoice.approved',
      aggregateId: this._id,
      tenantId: this.props.tenantId,
      occurredAt: new Date(),
      payload: {
        invoiceNumber: this.props.invoiceNumber,
        vendorId: this.props.vendorId,
        total: this.props.total.toString(),
      },
    });
  }

  /** Apply a payment to this invoice */
  applyPayment(amount: Money): void {
    if (
      this.props.status !== VendorInvoiceStatus.APPROVED &&
      this.props.status !== VendorInvoiceStatus.PARTIALLY_PAID
    ) {
      throw new Error(`Cannot apply payment in status: ${this.props.status}`);
    }
    if (amount.greaterThan(this.balance)) {
      throw new Error('Payment exceeds the remaining balance');
    }

    this.props.amountPaid = this.props.amountPaid.add(amount);
    this.props.updatedAt = new Date();

    if (this.balance.isZero()) {
      this.props.status = VendorInvoiceStatus.PAID;
      this.addDomainEvent({
        eventId: uuidv4(),
        eventType: 'vendor.invoice.paid',
        aggregateId: this._id,
        tenantId: this.props.tenantId,
        occurredAt: new Date(),
        payload: {
          invoiceNumber: this.props.invoiceNumber,
          vendorId: this.props.vendorId,
          totalPaid: this.props.amountPaid.toString(),
        },
      });
    } else {
      this.props.status = VendorInvoiceStatus.PARTIALLY_PAID;
    }
  }

  /** Void this invoice */
  void(): void {
    if (this.props.status === VendorInvoiceStatus.PAID) {
      throw new Error('Cannot void a fully paid invoice');
    }
    this.props.status = VendorInvoiceStatus.VOID;
    this.props.updatedAt = new Date();

    this.addDomainEvent({
      eventId: uuidv4(),
      eventType: 'vendor.invoice.voided',
      aggregateId: this._id,
      tenantId: this.props.tenantId,
      occurredAt: new Date(),
      payload: { invoiceNumber: this.props.invoiceNumber },
    });
  }
}
