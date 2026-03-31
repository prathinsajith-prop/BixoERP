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
    super(`${entity} with id ${id} not found`, 'ENTITY_NOT_FOUND');
    this.name = 'EntityNotFoundException';
  }
}

export class InvalidCredentialsException extends DomainException {
  constructor() {
    super('Invalid email or password', 'INVALID_CREDENTIALS');
    this.name = 'InvalidCredentialsException';
  }
}

export class AccountLockedException extends DomainException {
  constructor(lockedUntil: Date | null) {
    const msg = lockedUntil
      ? `Account is locked until ${lockedUntil.toISOString()}`
      : 'Account is locked';
    super(msg, 'ACCOUNT_LOCKED');
    this.name = 'AccountLockedException';
  }
}

export class AccountInactiveException extends DomainException {
  constructor() {
    super('Account is not active', 'ACCOUNT_INACTIVE');
    this.name = 'AccountInactiveException';
  }
}

export class DuplicateEmailException extends DomainException {
  constructor(email: string) {
    super(`Email ${email} is already registered`, 'DUPLICATE_EMAIL');
    this.name = 'DuplicateEmailException';
  }
}

export class TokenExpiredException extends DomainException {
  constructor() {
    super('Token has expired', 'TOKEN_EXPIRED');
    this.name = 'TokenExpiredException';
  }
}

export class TokenRevokedException extends DomainException {
  constructor() {
    super('Token has been revoked', 'TOKEN_REVOKED');
    this.name = 'TokenRevokedException';
  }
}

export class InsufficientPermissionsException extends DomainException {
  constructor(requiredPermission: string) {
    super(`Missing required permission: ${requiredPermission}`, 'INSUFFICIENT_PERMISSIONS');
    this.name = 'InsufficientPermissionsException';
  }
}
