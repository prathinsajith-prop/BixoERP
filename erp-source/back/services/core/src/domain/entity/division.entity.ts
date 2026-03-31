import { Entity } from './base.entity';

export class Division extends Entity {
  organizationId: string;
  name: string;
  code: string;
  description: string;
  headUserId: string | null;
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
    this.name = name;
    this.code = code;
    this.description = '';
    this.headUserId = null;
    this.status = 'ACTIVE';
  }

  static create(
    tenantId: string,
    organizationId: string,
    name: string,
    code: string,
  ): Division {
    return new Division(tenantId, organizationId, name, code);
  }

  static reconstitute(props: {
    id: string;
    tenantId: string;
    organizationId: string;
    name: string;
    code: string;
    description: string;
    headUserId: string | null;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: Date;
    updatedAt: Date;
  }): Division {
    const d = new Division(props.tenantId, props.organizationId, props.name, props.code, props.id);
    d.description = props.description;
    d.headUserId = props.headUserId;
    d.status = props.status;
    (d as any).createdAt = props.createdAt;
    d.updatedAt = props.updatedAt;
    return d;
  }

  update(fields: { name?: string; code?: string; description?: string; headUserId?: string | null; status?: 'ACTIVE' | 'INACTIVE' }): void {
    if (fields.name !== undefined) this.name = fields.name;
    if (fields.code !== undefined) this.code = fields.code;
    if (fields.description !== undefined) this.description = fields.description;
    if (fields.headUserId !== undefined) this.headUserId = fields.headUserId;
    if (fields.status !== undefined) this.status = fields.status;
    this.updatedAt = new Date();
  }
}
