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

export class InvalidStatusTransitionException extends DomainException {
  constructor(from: string, to: string) {
    super(`Cannot transition from ${from} to ${to}`, 'INVALID_STATUS_TRANSITION');
    this.name = 'InvalidStatusTransitionException';
  }
}

export class WorkflowAlreadyCompletedException extends DomainException {
  constructor(requestId: string) {
    super(`Approval request already completed: ${requestId}`, 'WORKFLOW_ALREADY_COMPLETED');
    this.name = 'WorkflowAlreadyCompletedException';
  }
}

export class UnauthorizedApproverException extends DomainException {
  constructor(userId: string, stepId: string) {
    super(`User ${userId} is not an authorized approver for step ${stepId}`, 'UNAUTHORIZED_APPROVER');
    this.name = 'UnauthorizedApproverException';
  }
}

export class StepAlreadyProcessedException extends DomainException {
  constructor(stepId: string) {
    super(`Approval step already processed: ${stepId}`, 'STEP_ALREADY_PROCESSED');
    this.name = 'StepAlreadyProcessedException';
  }
}
