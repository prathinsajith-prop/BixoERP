import { Entity } from './base.entity';

export class Permission extends Entity {
  resource: string;    // e.g. 'finance:journal_entry', 'hr:employee'
  action: string;      // e.g. 'read', 'write', 'delete', 'approve'
  description: string;

  private constructor(
    tenantId: string,
    resource: string,
    action: string,
    description: string,
    id?: string,
  ) {
    super(tenantId, id);
    this.resource = resource;
    this.action = action;
    this.description = description;
  }

  static create(
    tenantId: string,
    resource: string,
    action: string,
    description: string,
  ): Permission {
    return new Permission(tenantId, resource, action, description);
  }

  static reconstitute(props: {
    id: string;
    tenantId: string;
    resource: string;
    action: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
  }): Permission {
    const p = new Permission(props.tenantId, props.resource, props.action, props.description, props.id);
    (p as any).createdAt = props.createdAt;
    p.updatedAt = props.updatedAt;
    return p;
  }

  get code(): string {
    return `${this.resource}:${this.action}`;
  }
}
