import { v4 as uuidv4 } from 'uuid';
import { AggregateRoot, DomainEvent } from './aggregate-root.base';
import { EmploymentStatus } from '../value-objects/employment-status';
import { Money } from '../value-objects/money';
import { BusinessRuleViolation } from '../exceptions/domain.exceptions';

export interface EmployeeProps {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  dateOfBirth: Date;
  hireDate: Date;
  terminationDate: Date | null;
  departmentId: string;
  positionId: string;
  managerId: string | null;
  status: EmploymentStatus;
  baseSalary: Money;
  currency: string;
  tenantId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Employee extends AggregateRoot<EmployeeProps> {
  static create(
    props: {
      employeeCode: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string | null;
      dateOfBirth: Date;
      hireDate: Date;
      departmentId: string;
      positionId: string;
      managerId: string | null;
      baseSalary: Money;
      currency: string;
      tenantId: string;
      createdBy: string;
    },
    id?: string,
  ): Employee {
    const employee = new Employee(
      {
        ...props,
        status: EmploymentStatus.ACTIVE,
        terminationDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id ?? uuidv4(),
    );

    employee.addDomainEvent({
      eventId: uuidv4(),
      eventType: 'employee.hired',
      aggregateId: employee.id,
      tenantId: props.tenantId,
      occurredAt: new Date(),
      payload: {
        employeeCode: props.employeeCode,
        firstName: props.firstName,
        lastName: props.lastName,
        email: props.email,
        departmentId: props.departmentId,
        positionId: props.positionId,
        hireDate: props.hireDate.toISOString(),
      },
    });

    return employee;
  }

  static fromPersistence(props: EmployeeProps, id: string): Employee {
    return new Employee(props, id);
  }

  get employeeCode(): string {
    return this.props.employeeCode;
  }

  get firstName(): string {
    return this.props.firstName;
  }

  get lastName(): string {
    return this.props.lastName;
  }

  get fullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`;
  }

  get email(): string {
    return this.props.email;
  }

  get phone(): string | null {
    return this.props.phone;
  }

  get dateOfBirth(): Date {
    return this.props.dateOfBirth;
  }

  get hireDate(): Date {
    return this.props.hireDate;
  }

  get terminationDate(): Date | null {
    return this.props.terminationDate;
  }

  get departmentId(): string {
    return this.props.departmentId;
  }

  get positionId(): string {
    return this.props.positionId;
  }

  get managerId(): string | null {
    return this.props.managerId;
  }

  get status(): EmploymentStatus {
    return this.props.status;
  }

  get baseSalary(): Money {
    return this.props.baseSalary;
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

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /** Invariant: Cannot terminate an already-terminated employee */
  terminate(reason: string, terminationDate: Date): void {
    if (this.props.status === EmploymentStatus.TERMINATED) {
      throw new BusinessRuleViolation('Cannot terminate an already-terminated employee');
    }

    this.props.status = EmploymentStatus.TERMINATED;
    this.props.terminationDate = terminationDate;
    this.props.updatedAt = new Date();

    this.addDomainEvent({
      eventId: uuidv4(),
      eventType: 'employee.terminated',
      aggregateId: this.id,
      tenantId: this.props.tenantId,
      occurredAt: new Date(),
      payload: {
        employeeCode: this.props.employeeCode,
        firstName: this.props.firstName,
        lastName: this.props.lastName,
        reason,
        terminationDate: terminationDate.toISOString(),
        departmentId: this.props.departmentId,
      },
    });
  }

  transfer(newDepartmentId: string, newPositionId: string, newManagerId: string | null): void {
    if (this.props.status === EmploymentStatus.TERMINATED) {
      throw new BusinessRuleViolation('Cannot transfer a terminated employee');
    }

    const previousDepartmentId = this.props.departmentId;
    const previousPositionId = this.props.positionId;

    this.props.departmentId = newDepartmentId;
    this.props.positionId = newPositionId;
    this.props.managerId = newManagerId;
    this.props.updatedAt = new Date();

    this.addDomainEvent({
      eventId: uuidv4(),
      eventType: 'employee.transferred',
      aggregateId: this.id,
      tenantId: this.props.tenantId,
      occurredAt: new Date(),
      payload: {
        employeeCode: this.props.employeeCode,
        previousDepartmentId,
        newDepartmentId,
        previousPositionId,
        newPositionId,
      },
    });
  }

  updateSalary(newSalary: Money): void {
    if (this.props.status === EmploymentStatus.TERMINATED) {
      throw new BusinessRuleViolation('Cannot update salary of a terminated employee');
    }
    this.props.baseSalary = newSalary;
    this.props.updatedAt = new Date();
  }

  suspend(): void {
    if (this.props.status !== EmploymentStatus.ACTIVE) {
      throw new BusinessRuleViolation(`Cannot suspend employee in status: ${this.props.status}`);
    }
    this.props.status = EmploymentStatus.SUSPENDED;
    this.props.updatedAt = new Date();
  }

  reinstate(): void {
    if (this.props.status !== EmploymentStatus.SUSPENDED) {
      throw new BusinessRuleViolation(`Cannot reinstate employee in status: ${this.props.status}`);
    }
    this.props.status = EmploymentStatus.ACTIVE;
    this.props.updatedAt = new Date();
  }
}
