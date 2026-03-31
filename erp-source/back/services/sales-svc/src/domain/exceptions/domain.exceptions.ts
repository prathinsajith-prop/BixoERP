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

export class InvalidOrderStateTransition extends DomainException {
  constructor(currentStatus: string, targetStatus: string) {
    super(
      `Invalid order state transition from ${currentStatus} to ${targetStatus}`,
      'INVALID_ORDER_STATE_TRANSITION',
    );
    this.name = 'InvalidOrderStateTransition';
  }
}

export class OrderAlreadyConfirmedException extends DomainException {
  constructor(orderId: string) {
    super(`Order already confirmed: ${orderId}`, 'ORDER_ALREADY_CONFIRMED');
    this.name = 'OrderAlreadyConfirmedException';
  }
}

export class OrderNotConfirmedException extends DomainException {
  constructor(orderId: string) {
    super(`Order not confirmed, cannot fulfill: ${orderId}`, 'ORDER_NOT_CONFIRMED');
    this.name = 'OrderNotConfirmedException';
  }
}

export class EmptyOrderException extends DomainException {
  constructor() {
    super('Cannot confirm an order with no lines', 'EMPTY_ORDER');
    this.name = 'EmptyOrderException';
  }
}
