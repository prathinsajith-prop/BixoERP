import { AggregateRoot } from './base.entity';
import { HashedPassword } from '../value-object/hashed-password.vo';
import { Email } from '../value-object/email.vo';

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  LOCKED = 'LOCKED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export class User extends AggregateRoot {
  email: Email;
  hashedPassword: HashedPassword;
  firstName: string;
  lastName: string;
  status: UserStatus;
  roles: string[];           // role IDs
  failedLoginAttempts: number;
  lastLoginAt: Date | null;
  passwordChangedAt: Date;
  emailVerifiedAt: Date | null;
  lockedUntil: Date | null;

  private constructor(
    tenantId: string,
    email: Email,
    hashedPassword: HashedPassword,
    firstName: string,
    lastName: string,
    id?: string,
  ) {
    super(tenantId, id);
    this.email = email;
    this.hashedPassword = hashedPassword;
    this.firstName = firstName;
    this.lastName = lastName;
    this.status = UserStatus.PENDING_VERIFICATION;
    this.roles = [];
    this.failedLoginAttempts = 0;
    this.lastLoginAt = null;
    this.passwordChangedAt = new Date();
    this.emailVerifiedAt = null;
    this.lockedUntil = null;
  }

  static create(
    tenantId: string,
    email: Email,
    hashedPassword: HashedPassword,
    firstName: string,
    lastName: string,
  ): User {
    const user = new User(tenantId, email, hashedPassword, firstName, lastName);
    user.addDomainEvent({
      eventType: 'auth.user.registered',
      aggregateId: user.id,
      tenantId,
      occurredAt: new Date(),
      payload: { email: email.value, firstName, lastName },
    });
    return user;
  }

  static reconstitute(props: {
    id: string;
    tenantId: string;
    email: string;
    hashedPassword: string;
    firstName: string;
    lastName: string;
    status: UserStatus;
    roles: string[];
    failedLoginAttempts: number;
    lastLoginAt: Date | null;
    passwordChangedAt: Date;
    emailVerifiedAt: Date | null;
    lockedUntil: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    const user = new User(
      props.tenantId,
      Email.create(props.email),
      HashedPassword.fromHash(props.hashedPassword),
      props.firstName,
      props.lastName,
      props.id,
    );
    user.status = props.status;
    user.roles = props.roles;
    user.failedLoginAttempts = props.failedLoginAttempts;
    user.lastLoginAt = props.lastLoginAt;
    user.passwordChangedAt = props.passwordChangedAt;
    user.emailVerifiedAt = props.emailVerifiedAt;
    user.lockedUntil = props.lockedUntil;
    (user as any).createdAt = props.createdAt;
    user.updatedAt = props.updatedAt;
    return user;
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  isLocked(): boolean {
    if (this.status === UserStatus.LOCKED) {
      if (this.lockedUntil && this.lockedUntil <= new Date()) {
        return false; // lock expired
      }
      return true;
    }
    return false;
  }

  canLogin(): boolean {
    return (
      this.status === UserStatus.ACTIVE &&
      !this.isLocked()
    );
  }

  recordSuccessfulLogin(): void {
    this.failedLoginAttempts = 0;
    this.lastLoginAt = new Date();
    this.updatedAt = new Date();
    this.addDomainEvent({
      eventType: 'auth.user.logged_in',
      aggregateId: this.id,
      tenantId: this.tenantId,
      occurredAt: new Date(),
      payload: { email: this.email.value },
    });
  }

  recordFailedLogin(maxAttempts: number, lockDurationMinutes: number): void {
    this.failedLoginAttempts += 1;
    this.updatedAt = new Date();
    if (this.failedLoginAttempts >= maxAttempts) {
      this.status = UserStatus.LOCKED;
      this.lockedUntil = new Date(Date.now() + lockDurationMinutes * 60_000);
      this.addDomainEvent({
        eventType: 'auth.user.locked',
        aggregateId: this.id,
        tenantId: this.tenantId,
        occurredAt: new Date(),
        payload: {
          email: this.email.value,
          failedAttempts: this.failedLoginAttempts,
          lockedUntil: this.lockedUntil.toISOString(),
        },
      });
    }
  }

  activate(): void {
    this.status = UserStatus.ACTIVE;
    this.emailVerifiedAt = new Date();
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.status = UserStatus.INACTIVE;
    this.updatedAt = new Date();
  }

  unlock(): void {
    this.status = UserStatus.ACTIVE;
    this.failedLoginAttempts = 0;
    this.lockedUntil = null;
    this.updatedAt = new Date();
  }

  changePassword(newHashedPassword: HashedPassword): void {
    this.hashedPassword = newHashedPassword;
    this.passwordChangedAt = new Date();
    this.updatedAt = new Date();
    this.addDomainEvent({
      eventType: 'auth.user.password_changed',
      aggregateId: this.id,
      tenantId: this.tenantId,
      occurredAt: new Date(),
      payload: { email: this.email.value },
    });
  }

  assignRole(roleId: string): void {
    if (!this.roles.includes(roleId)) {
      this.roles.push(roleId);
      this.updatedAt = new Date();
      this.addDomainEvent({
        eventType: 'auth.user.role_assigned',
        aggregateId: this.id,
        tenantId: this.tenantId,
        occurredAt: new Date(),
        payload: { roleId },
      });
    }
  }

  removeRole(roleId: string): void {
    this.roles = this.roles.filter((r) => r !== roleId);
    this.updatedAt = new Date();
  }
}
