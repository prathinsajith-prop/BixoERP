import { randomUUID } from 'crypto';

export enum OrgMemberRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export class UserOrganization {
  readonly id: string;
  readonly userId: string;
  readonly organizationId: string;
  role: OrgMemberRole;
  readonly joinedAt: Date;

  private constructor(id: string, userId: string, organizationId: string, role: OrgMemberRole) {
    this.id = id;
    this.userId = userId;
    this.organizationId = organizationId;
    this.role = role;
    this.joinedAt = new Date();
  }

  static create(userId: string, organizationId: string, role: OrgMemberRole): UserOrganization {
    return new UserOrganization(randomUUID(), userId, organizationId, role);
  }

  static reconstitute(props: {
    id: string;
    userId: string;
    organizationId: string;
    role: OrgMemberRole;
    joinedAt: Date;
  }): UserOrganization {
    const uo = new UserOrganization(props.id, props.userId, props.organizationId, props.role);
    (uo as any).joinedAt = props.joinedAt;
    return uo;
  }
}
