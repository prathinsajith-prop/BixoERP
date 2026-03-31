import { v4 as uuidv4 } from 'uuid';
import { AggregateRoot } from './aggregate-root.base';
import { OrderStatus } from '../value-objects/order-status';
import { Money } from '../value-objects/money';
import {
  BusinessRuleViolation,
  OrderAlreadyConfirmedException,
  OrderNotConfirmedException,
  EmptyOrderException,
  InvalidOrderStateTransition,
} from '../exceptions/domain.exceptions';

export interface OrderLineProps {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: Money;
  discount: number; // percentage 0–100
  lineTotal: Money;
}

export interface SalesOrderProps {
  orderNumber: string;
  customerId: string;
  customerName: string;
  status: OrderStatus;
  lines: OrderLineProps[];
  currency: string;
  subtotal: Money;
  taxRate: number;
  taxAmount: Money;
  totalAmount: Money;
  notes: string | null;
  quotationId: string | null;
  tenantId: string;
  createdBy: string;
  confirmedAt: Date | null;
  fulfilledAt: Date | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class SalesOrder extends AggregateRoot<SalesOrderProps> {
  static create(
    props: {
      orderNumber: string;
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
      notes: string | null;
      quotationId: string | null;
      tenantId: string;
      createdBy: string;
    },
    id?: string,
  ): SalesOrder {
    const currency = props.currency;

    const orderLines: OrderLineProps[] = props.lines.map((l) => {
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

    const subtotal = orderLines.reduce(
      (sum, line) => sum.add(line.lineTotal),
      Money.zero(currency),
    );
    const taxAmount = subtotal.multiply(props.taxRate / 100);
    const totalAmount = subtotal.add(taxAmount);

    const order = new SalesOrder(
      {
        orderNumber: props.orderNumber,
        customerId: props.customerId,
        customerName: props.customerName,
        status: OrderStatus.DRAFT,
        lines: orderLines,
        currency,
        subtotal,
        taxRate: props.taxRate,
        taxAmount,
        totalAmount,
        notes: props.notes,
        quotationId: props.quotationId,
        tenantId: props.tenantId,
        createdBy: props.createdBy,
        confirmedAt: null,
        fulfilledAt: null,
        cancelledAt: null,
        cancellationReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id ?? uuidv4(),
    );

    order.addDomainEvent({
      eventId: uuidv4(),
      eventType: 'sales.order.created',
      aggregateId: order.id,
      tenantId: props.tenantId,
      occurredAt: new Date(),
      payload: {
        orderNumber: props.orderNumber,
        customerId: props.customerId,
        totalAmount: totalAmount.amount,
        currency,
        lineCount: orderLines.length,
      },
    });

    return order;
  }

  static fromPersistence(props: SalesOrderProps, id: string): SalesOrder {
    return new SalesOrder(props, id);
  }

  // ── Getters ──────────────────────────────────────────

  get orderNumber(): string {
    return this.props.orderNumber;
  }

  get customerId(): string {
    return this.props.customerId;
  }

  get customerName(): string {
    return this.props.customerName;
  }

  get status(): OrderStatus {
    return this.props.status;
  }

  get lines(): ReadonlyArray<OrderLineProps> {
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

  get notes(): string | null {
    return this.props.notes;
  }

  get quotationId(): string | null {
    return this.props.quotationId;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get createdBy(): string {
    return this.props.createdBy;
  }

  get confirmedAt(): Date | null {
    return this.props.confirmedAt;
  }

  get fulfilledAt(): Date | null {
    return this.props.fulfilledAt;
  }

  get cancelledAt(): Date | null {
    return this.props.cancelledAt;
  }

  get cancellationReason(): string | null {
    return this.props.cancellationReason;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // ── State transitions ────────────────────────────────

  confirm(): void {
    if (this.props.status === OrderStatus.CONFIRMED) {
      throw new OrderAlreadyConfirmedException(this.id);
    }
    if (this.props.status !== OrderStatus.DRAFT) {
      throw new InvalidOrderStateTransition(this.props.status, OrderStatus.CONFIRMED);
    }
    if (this.props.lines.length === 0) {
      throw new EmptyOrderException();
    }

    this.props.status = OrderStatus.CONFIRMED;
    this.props.confirmedAt = new Date();
    this.props.updatedAt = new Date();

    this.addDomainEvent({
      eventId: uuidv4(),
      eventType: 'sales.order.confirmed',
      aggregateId: this.id,
      tenantId: this.props.tenantId,
      occurredAt: new Date(),
      payload: {
        orderNumber: this.props.orderNumber,
        customerId: this.props.customerId,
        customerName: this.props.customerName,
        totalAmount: this.props.totalAmount.amount,
        currency: this.props.currency,
        lines: this.props.lines.map((l) => ({
          productId: l.productId,
          productName: l.productName,
          quantity: l.quantity,
          unitPrice: l.unitPrice.amount,
          lineTotal: l.lineTotal.amount,
        })),
      },
    });
  }

  fulfill(): void {
    if (this.props.status !== OrderStatus.CONFIRMED) {
      throw new OrderNotConfirmedException(this.id);
    }

    this.props.status = OrderStatus.FULFILLED;
    this.props.fulfilledAt = new Date();
    this.props.updatedAt = new Date();

    this.addDomainEvent({
      eventId: uuidv4(),
      eventType: 'sales.order.fulfilled',
      aggregateId: this.id,
      tenantId: this.props.tenantId,
      occurredAt: new Date(),
      payload: {
        orderNumber: this.props.orderNumber,
        customerId: this.props.customerId,
        customerName: this.props.customerName,
        totalAmount: this.props.totalAmount.amount,
        currency: this.props.currency,
      },
    });
  }

  cancel(reason: string): void {
    if (this.props.status === OrderStatus.FULFILLED) {
      throw new BusinessRuleViolation('Cannot cancel a fulfilled order');
    }
    if (this.props.status === OrderStatus.CANCELLED) {
      throw new BusinessRuleViolation('Order is already cancelled');
    }

    this.props.status = OrderStatus.CANCELLED;
    this.props.cancelledAt = new Date();
    this.props.cancellationReason = reason;
    this.props.updatedAt = new Date();

    this.addDomainEvent({
      eventId: uuidv4(),
      eventType: 'sales.order.cancelled',
      aggregateId: this.id,
      tenantId: this.props.tenantId,
      occurredAt: new Date(),
      payload: {
        orderNumber: this.props.orderNumber,
        customerId: this.props.customerId,
        reason,
      },
    });
  }

  /** Recalculate totals from lines */
  private recalculateTotals(): void {
    this.props.subtotal = this.props.lines.reduce(
      (sum, line) => sum.add(line.lineTotal),
      Money.zero(this.props.currency),
    );
    this.props.taxAmount = this.props.subtotal.multiply(this.props.taxRate / 100);
    this.props.totalAmount = this.props.subtotal.add(this.props.taxAmount);
  }

  addLine(line: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    discount: number;
  }): void {
    if (this.props.status !== OrderStatus.DRAFT) {
      throw new BusinessRuleViolation('Cannot modify lines on a non-draft order');
    }

    const unitPrice = Money.create(line.unitPrice, this.props.currency);
    const discountMultiplier = 1 - line.discount / 100;
    const lineTotal = unitPrice.multiply(line.quantity * discountMultiplier);

    this.props.lines.push({
      id: uuidv4(),
      productId: line.productId,
      productName: line.productName,
      quantity: line.quantity,
      unitPrice,
      discount: line.discount,
      lineTotal,
    });

    this.recalculateTotals();
    this.props.updatedAt = new Date();
  }

  removeLine(lineId: string): void {
    if (this.props.status !== OrderStatus.DRAFT) {
      throw new BusinessRuleViolation('Cannot modify lines on a non-draft order');
    }

    const idx = this.props.lines.findIndex((l) => l.id === lineId);
    if (idx === -1) {
      throw new BusinessRuleViolation(`Order line not found: ${lineId}`);
    }

    this.props.lines.splice(idx, 1);
    this.recalculateTotals();
    this.props.updatedAt = new Date();
  }
}
