export class DomainException extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'DomainException';
  }
}

export class ProjectNotFoundException extends DomainException {
  constructor(id: string) {
    super(`Project not found: ${id}`, 'PROJECT_NOT_FOUND');
    this.name = 'ProjectNotFoundException';
  }
}

export class TaskNotFoundException extends DomainException {
  constructor(id: string) {
    super(`Task not found: ${id}`, 'TASK_NOT_FOUND');
    this.name = 'TaskNotFoundException';
  }
}

export class InvalidStatusTransition extends DomainException {
  constructor(from: string, to: string) {
    super(`Invalid status transition from ${from} to ${to}`, 'INVALID_STATUS_TRANSITION');
    this.name = 'InvalidStatusTransition';
  }
}

export class BudgetExceededException extends DomainException {
  constructor(projectId: string, budget: string, actual: string) {
    super(
      `Budget exceeded for project ${projectId}: budget=${budget}, actual=${actual}`,
      'BUDGET_EXCEEDED',
    );
    this.name = 'BudgetExceededException';
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
