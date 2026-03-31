import { Entity } from './base.entity';

export class Team extends Entity {
  organizationId: string;
  departmentId: string | null;
  name: string;
  code: string;
  description: string;
  leadUserId: string | null;
  status: 'ACTIVE' | 'INACTIVE';

  private constructor(
    tenantId: string,
    organizationId: string,
    name: string,
    code: string,
    id?: string,
  ) {
    super(tenantId, id);
    this.organizationId = organizationId;
    this.departmentId = null;
    this.name = name;
    this.code = code;
    this.description = '';
    this.leadUserId = null;
    this.status = 'ACTIVE';
  }

  static create(
    tenantId: string,
    organizationId: string,
    name: string,
    code: string,
  ): Team {
    return new Team(tenantId, organizationId, name, code);
  }

  static reconstitute(props: {
    id: string;
    tenantId: string;
    organizationId: string;
    departmentId: string | null;
    name: string;
    code: string;
    description: string;
    leadUserId: string | null;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: Date;
    updatedAt: Date;
  }): Team {
    const t = new Team(props.tenantId, props.organizationId, props.name, props.code, props.id);
    t.departmentId = props.departmentId;
    t.description = props.description;
    t.leadUserId = props.leadUserId;
    t.status = props.status;
    (t as any).createdAt = props.createdAt;
    t.updatedAt = props.updatedAt;
    return t;
  }

  update(fields: { name?: string; code?: string; description?: string; departmentId?: string | null; leadUserId?: string | null; status?: 'ACTIVE' | 'INACTIVE' }): void {
    if (fields.name !== undefined) this.name = fields.name;
    if (fields.code !== undefined) this.code = fields.code;
    if (fields.description !== undefined) this.description = fields.description;
    if (fields.departmentId !== undefined) this.departmentId = fields.departmentId;
    if (fields.leadUserId !== undefined) this.leadUserId = fields.leadUserId;
    if (fields.status !== undefined) this.status = fields.status;
    this.updatedAt = new Date();
  }
}
