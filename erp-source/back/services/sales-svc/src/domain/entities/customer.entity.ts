import { v4 as uuidv4 } from 'uuid';

export interface CustomerProps {
  customerNumber: string;
  name: string;
  email: string;
  phone: string | null;
  billingAddress: string | null;
  shippingAddress: string | null;
  taxId: string | null;
  creditLimit: string; // NUMERIC(19,4) stored as string
  currency: string;
  isActive: boolean;
  tenantId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Customer {
  private readonly _id: string;
  private props: CustomerProps;

  private constructor(props: CustomerProps, id: string) {
    this._id = id;
    this.props = props;
  }

  static create(
    props: {
      customerNumber: string;
      name: string;
      email: string;
      phone: string | null;
      billingAddress: string | null;
      shippingAddress: string | null;
      taxId: string | null;
      creditLimit: number;
      currency: string;
      tenantId: string;
      createdBy: string;
    },
    id?: string,
  ): Customer {
    return new Customer(
      {
        ...props,
        creditLimit: props.creditLimit.toFixed(4),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id ?? uuidv4(),
    );
  }

  static fromPersistence(props: CustomerProps, id: string): Customer {
    return new Customer(props, id);
  }

  get id(): string {
    return this._id;
  }

  get customerNumber(): string {
    return this.props.customerNumber;
  }

  get name(): string {
    return this.props.name;
  }

  get email(): string {
    return this.props.email;
  }

  get phone(): string | null {
    return this.props.phone;
  }

  get billingAddress(): string | null {
    return this.props.billingAddress;
  }

  get shippingAddress(): string | null {
    return this.props.shippingAddress;
  }

  get taxId(): string | null {
    return this.props.taxId;
  }

  get creditLimit(): string {
    return this.props.creditLimit;
  }

  get currency(): string {
    return this.props.currency;
  }

  get isActive(): boolean {
    return this.props.isActive;
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

  update(data: {
    name?: string;
    email?: string;
    phone?: string | null;
    billingAddress?: string | null;
    shippingAddress?: string | null;
    taxId?: string | null;
    creditLimit?: number;
    currency?: string;
  }): void {
    if (data.name !== undefined) this.props.name = data.name;
    if (data.email !== undefined) this.props.email = data.email;
    if (data.phone !== undefined) this.props.phone = data.phone;
    if (data.billingAddress !== undefined) this.props.billingAddress = data.billingAddress;
    if (data.shippingAddress !== undefined) this.props.shippingAddress = data.shippingAddress;
    if (data.taxId !== undefined) this.props.taxId = data.taxId;
    if (data.creditLimit !== undefined) this.props.creditLimit = data.creditLimit.toFixed(4);
    if (data.currency !== undefined) this.props.currency = data.currency;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }
}
