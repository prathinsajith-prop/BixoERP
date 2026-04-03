import { randomUUID } from 'crypto';

export enum OrgMemberRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export enum OrgMemberStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  INVITED = 'invited',
}

export class UserOrganization {
  readonly id: string;
  readonly userId: string;
  readonly organizationId: string;
  role: OrgMemberRole;
  /** FK to Role entity for RBAC — null falls back to user.roles[] */
  roleId: string | null;
  /** Linked HR employee profile (cross-service reference) */
  employeeId: string | null;
  /** userId of the person who sent the invitation */
  invitedBy: string | null;
  status: OrgMemberStatus;
  readonly joinedAt: Date;
  /** Timestamp when membership was deactivated */
  leftAt: Date | null;

  private constructor(id: string, userId: string, organizationId: string, role: OrgMemberRole) {
    this.id = id;
    this.userId = userId;
    this.organizationId = organizationId;
    this.role = role;
    this.roleId = null;
    this.employeeId = null;
    this.invitedBy = null;
    this.status = OrgMemberStatus.ACTIVE;
    this.joinedAt = new Date();
    this.leftAt = null;
  }

  isActive(): boolean {
    return this.status === OrgMemberStatus.ACTIVE;
  }

  deactivate(): void {
    this.status = OrgMemberStatus.INACTIVE;
    this.leftAt = new Date();
  }

  static create(
    userId: string,
    organizationId: string,
    role: OrgMemberRole,
    options?: { roleId?: string; employeeId?: string; invitedBy?: string },
  ): UserOrganization {
    const uo = new UserOrganization(randomUUID(), userId, organizationId, role);
    if (options?.roleId) uo.roleId = options.roleId;
    if (options?.employeeId) uo.employeeId = options.employeeId;
    if (options?.invitedBy) uo.invitedBy = options.invitedBy;
    return uo;
  }

  static reconstitute(props: {
    id: string;
    userId: string;
    organizationId: string;
    role: OrgMemberRole;
    roleId?: string | null;
    employeeId?: string | null;
    invitedBy?: string | null;
    status: OrgMemberStatus;
    joinedAt: Date;
    leftAt?: Date | null;
  }): UserOrganization {
    const uo = new UserOrganization(props.id, props.userId, props.organizationId, props.role);
    uo.roleId = props.roleId ?? null;
    uo.employeeId = props.employeeId ?? null;
    uo.invitedBy = props.invitedBy ?? null;
    uo.status = props.status;
    (uo as { joinedAt: Date }).joinedAt = props.joinedAt;
    uo.leftAt = props.leftAt ?? null;
    return uo;
  }
}
