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

export class ThreeWayMatchFailedException extends DomainException {
  constructor(invoiceId: string, reason: string) {
    super(`3-way match failed for invoice ${invoiceId}: ${reason}`, 'THREE_WAY_MATCH_FAILED');
    this.name = 'ThreeWayMatchFailedException';
  }
}

export class PaymentRunException extends DomainException {
  constructor(message: string) {
    super(message, 'PAYMENT_RUN_ERROR');
    this.name = 'PaymentRunException';
  }
}

export class DuplicateEntryException extends DomainException {
  constructor(field: string, value: string) {
    super(`Duplicate ${field}: ${value}`, 'DUPLICATE_ENTRY');
    this.name = 'DuplicateEntryException';
  }
}

export class InvoiceOverdueException extends DomainException {
  constructor(invoiceNumber: string, daysPastDue: number) {
    super(
      `Invoice ${invoiceNumber} is ${daysPastDue} days past due`,
      'INVOICE_OVERDUE',
    );
    this.name = 'InvoiceOverdueException';
  }
}
