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

export class WebhookDeliveryException extends DomainException {
  constructor(subscriptionId: string, message: string) {
    super(`Webhook delivery failed for subscription ${subscriptionId}: ${message}`, 'WEBHOOK_DELIVERY_FAILED');
    this.name = 'WebhookDeliveryException';
  }
}

export class InvalidWebhookTransition extends DomainException {
  constructor(from: string, to: string) {
    super(`Invalid webhook status transition: ${from} → ${to}`, 'INVALID_TRANSITION');
    this.name = 'InvalidWebhookTransition';
  }
}

export class HmacVerificationException extends DomainException {
  constructor(subscriptionId: string) {
    super(`HMAC verification failed for subscription ${subscriptionId}`, 'HMAC_VERIFICATION_FAILED');
    this.name = 'HmacVerificationException';
  }
}

export class MaxRetriesExceededException extends DomainException {
  constructor(subscriptionId: string, attempts: number) {
    super(`Max retries (${attempts}) exceeded for subscription ${subscriptionId}`, 'MAX_RETRIES_EXCEEDED');
    this.name = 'MaxRetriesExceededException';
  }
}
