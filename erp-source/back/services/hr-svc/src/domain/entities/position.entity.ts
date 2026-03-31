import { Entity } from './entity.base';
import { Money } from '../value-objects/money';

export interface PositionProps {
  code: string;
  title: string;
  departmentId: string;
  minSalary: Money;
  maxSalary: Money;
  currency: string;
  isActive: boolean;
  tenantId: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Position extends Entity<PositionProps> {
  static create(
    props: Omit<PositionProps, 'isActive' | 'createdAt' | 'updatedAt'>,
    id?: string,
  ): Position {
    return new Position(
      {
        ...props,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id,
    );
  }

  static fromPersistence(props: PositionProps, id: string): Position {
    return new Position(props, id);
  }

  get code(): string {
    return this.props.code;
  }

  get title(): string {
    return this.props.title;
  }

  get departmentId(): string {
    return this.props.departmentId;
  }

  get minSalary(): Money {
    return this.props.minSalary;
  }

  get maxSalary(): Money {
    return this.props.maxSalary;
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

  get description(): string | null {
    return this.props.description;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  isSalaryInRange(salary: Money): boolean {
    return (
      salary.amountAsNumber >= this.props.minSalary.amountAsNumber &&
      salary.amountAsNumber <= this.props.maxSalary.amountAsNumber
    );
  }
}
