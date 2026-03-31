import { Entity } from './entity.base';
import { PaymentTerms } from '../value-objects/payment-terms';

export interface PaymentTermEntityProps {
  code: string;
  description: string;
  netDays: number;
  discountPercent: number;
  discountDays: number;
  isActive: boolean;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class PaymentTermEntity extends Entity<PaymentTermEntityProps> {
  static create(
    props: {
      code: string;
      description: string;
      netDays: number;
      discountPercent: number;
      discountDays: number;
      tenantId: string;
    },
    id?: string,
  ): PaymentTermEntity {
    // Validate via value object
    if (props.discountPercent > 0) {
      PaymentTerms.withDiscount(props.discountPercent, props.discountDays, props.netDays);
    } else {
      PaymentTerms.net(props.netDays);
    }

    return new PaymentTermEntity(
      {
        ...props,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id,
    );
  }

  static fromPersistence(props: PaymentTermEntityProps, id: string): PaymentTermEntity {
    return new PaymentTermEntity(props, id);
  }

  get code(): string {
    return this.props.code;
  }

  get description(): string {
    return this.props.description;
  }

  get netDays(): number {
    return this.props.netDays;
  }

  get discountPercent(): number {
    return this.props.discountPercent;
  }

  get discountDays(): number {
    return this.props.discountDays;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  /** Convert to PaymentTerms value object */
  toValueObject(): PaymentTerms {
    if (this.props.discountPercent > 0) {
      return PaymentTerms.withDiscount(
        this.props.discountPercent,
        this.props.discountDays,
        this.props.netDays,
      );
    }
    return PaymentTerms.net(this.props.netDays);
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }
}
