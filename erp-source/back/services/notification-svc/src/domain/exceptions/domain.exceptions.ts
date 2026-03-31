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

export class InvalidNotificationTransition extends DomainException {
  constructor(from: string, to: string) {
    super(`Invalid notification status transition: ${from} → ${to}`, 'INVALID_TRANSITION');
    this.name = 'InvalidNotificationTransition';
  }
}

export class TemplateRenderException extends DomainException {
  constructor(templateCode: string, message: string) {
    super(`Failed to render template "${templateCode}": ${message}`, 'TEMPLATE_RENDER_ERROR');
    this.name = 'TemplateRenderException';
  }
}

export class ChannelDisabledException extends DomainException {
  constructor(userId: string, channel: string) {
    super(`Channel ${channel} is disabled for user ${userId}`, 'CHANNEL_DISABLED');
    this.name = 'ChannelDisabledException';
  }
}
