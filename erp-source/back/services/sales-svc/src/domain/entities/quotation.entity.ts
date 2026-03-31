import { v4 as uuidv4 } from 'uuid';
import { Money } from '../value-objects/money';

export enum QuotationStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export interface QuotationLineProps {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: Money;
  discount: number;
  lineTotal: Money;
}

export interface QuotationProps {
  quotationNumber: string;
  customerId: string;
  customerName: string;
  status: QuotationStatus;
  lines: QuotationLineProps[];
  currency: string;
  subtotal: Money;
  taxRate: number;
  taxAmount: Money;
  totalAmount: Money;
  validUntil: Date;
  notes: string | null;
  tenantId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Quotation {
  private readonly _id: string;
  private props: QuotationProps;

  private constructor(props: QuotationProps, id: string) {
    this._id = id;
    this.props = props;
  }

  static create(
    props: {
      quotationNumber: string;
      customerId: string;
      customerName: string;
      lines: Array<{
        productId: string;
        productName: string;
        quantity: number;
        unitPrice: number;
        discount: number;
      }>;
      currency: string;
      taxRate: number;
      validUntil: Date;
      notes: string | null;
      tenantId: string;
      createdBy: string;
    },
    id?: string,
  ): Quotation {
    const currency = props.currency;

    const quotationLines: QuotationLineProps[] = props.lines.map((l) => {
      const unitPrice = Money.create(l.unitPrice, currency);
      const discountMultiplier = 1 - l.discount / 100;
      const lineTotal = unitPrice.multiply(l.quantity * discountMultiplier);
      return {
        id: uuidv4(),
        productId: l.productId,
        productName: l.productName,
        quantity: l.quantity,
        unitPrice,
        discount: l.discount,
        lineTotal,
      };
    });

    const subtotal = quotationLines.reduce(
      (sum, line) => sum.add(line.lineTotal),
      Money.zero(currency),
    );
    const taxAmount = subtotal.multiply(props.taxRate / 100);
    const totalAmount = subtotal.add(taxAmount);

    return new Quotation(
      {
        quotationNumber: props.quotationNumber,
        customerId: props.customerId,
        customerName: props.customerName,
        status: QuotationStatus.DRAFT,
        lines: quotationLines,
        currency,
        subtotal,
        taxRate: props.taxRate,
        taxAmount,
        totalAmount,
        validUntil: props.validUntil,
        notes: props.notes,
        tenantId: props.tenantId,
        createdBy: props.createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id ?? uuidv4(),
    );
  }

  static fromPersistence(props: QuotationProps, id: string): Quotation {
    return new Quotation(props, id);
  }

  get id(): string {
    return this._id;
  }

  get quotationNumber(): string {
    return this.props.quotationNumber;
  }

  get customerId(): string {
    return this.props.customerId;
  }

  get customerName(): string {
    return this.props.customerName;
  }

  get status(): QuotationStatus {
    return this.props.status;
  }

  get lines(): ReadonlyArray<QuotationLineProps> {
    return this.props.lines;
  }

  get currency(): string {
    return this.props.currency;
  }

  get subtotal(): Money {
    return this.props.subtotal;
  }

  get taxRate(): number {
    return this.props.taxRate;
  }

  get taxAmount(): Money {
    return this.props.taxAmount;
  }

  get totalAmount(): Money {
    return this.props.totalAmount;
  }

  get validUntil(): Date {
    return this.props.validUntil;
  }

  get notes(): string | null {
    return this.props.notes;
  }

  get tenantId(): string {
    return this.props.tenantId;
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

  send(): void {
    if (this.props.status !== QuotationStatus.DRAFT) {
      throw new Error(`Cannot send quotation in ${this.props.status} status`);
    }
    this.props.status = QuotationStatus.SENT;
    this.props.updatedAt = new Date();
  }

  accept(): void {
    if (this.props.status !== QuotationStatus.SENT) {
      throw new Error(`Cannot accept quotation in ${this.props.status} status`);
    }
    this.props.status = QuotationStatus.ACCEPTED;
    this.props.updatedAt = new Date();
  }

  reject(): void {
    if (this.props.status !== QuotationStatus.SENT) {
      throw new Error(`Cannot reject quotation in ${this.props.status} status`);
    }
    this.props.status = QuotationStatus.REJECTED;
    this.props.updatedAt = new Date();
  }

  expire(): void {
    if (this.props.status === QuotationStatus.ACCEPTED || this.props.status === QuotationStatus.REJECTED) {
      return; // already terminal
    }
    this.props.status = QuotationStatus.EXPIRED;
    this.props.updatedAt = new Date();
  }
}
