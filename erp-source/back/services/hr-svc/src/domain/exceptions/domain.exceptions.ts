export class DomainException extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'DomainException';
  }
}

export class EntityNotFoundException extends DomainException {
  constructor(entity: string, id: string) {
    super(`${entity} not found: ${id}`, 'ENTITY_NOT_FOUND');
    this.name = 'EntityNotFoundException';
  }
}

export class BusinessRuleViolation extends DomainException {
  constructor(message: string) {
    super(message, 'BUSINESS_RULE_VIOLATION');
    this.name = 'BusinessRuleViolation';
  }
}

export class DuplicateEntryException extends DomainException {
  constructor(field: string, value: string) {
    super(`Duplicate ${field}: ${value}`, 'DUPLICATE_ENTRY');
    this.name = 'DuplicateEntryException';
  }
}

export class InsufficientLeaveBalanceException extends DomainException {
  constructor(leaveType: string, available: number, requested: number) {
    super(
      `Insufficient ${leaveType} leave balance: available=${available}, requested=${requested}`,
      'INSUFFICIENT_LEAVE_BALANCE',
    );
    this.name = 'InsufficientLeaveBalanceException';
  }
}

export class EmployeeAlreadyTerminatedException extends DomainException {
  constructor(employeeId: string) {
    super(`Employee already terminated: ${employeeId}`, 'EMPLOYEE_ALREADY_TERMINATED');
    this.name = 'EmployeeAlreadyTerminatedException';
  }
}
