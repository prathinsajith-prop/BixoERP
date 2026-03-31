import { Entity } from './base.entity';

export class Role extends Entity {
  name: string;
  description: string;
  permissions: string[];   // permission IDs
  isSystem: boolean;       // system roles cannot be deleted

  private constructor(
    tenantId: string,
    name: string,
    description: string,
    isSystem: boolean,
    id?: string,
  ) {
    super(tenantId, id);
    this.name = name;
    this.description = description;
    this.permissions = [];
    this.isSystem = isSystem;
  }

  static create(
    tenantId: string,
    name: string,
    description: string,
    isSystem = false,
  ): Role {
    return new Role(tenantId, name, description, isSystem);
  }

  static reconstitute(props: {
    id: string;
    tenantId: string;
    name: string;
    description: string;
    permissions: string[];
    isSystem: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): Role {
    const role = new Role(props.tenantId, props.name, props.description, props.isSystem, props.id);
    role.permissions = props.permissions;
    (role as any).createdAt = props.createdAt;
    role.updatedAt = props.updatedAt;
    return role;
  }

  addPermission(permissionId: string): void {
    if (!this.permissions.includes(permissionId)) {
      this.permissions.push(permissionId);
      this.updatedAt = new Date();
    }
  }

  removePermission(permissionId: string): void {
    this.permissions = this.permissions.filter((p) => p !== permissionId);
    this.updatedAt = new Date();
  }

  update(name: string, description: string): void {
    this.name = name;
    this.description = description;
    this.updatedAt = new Date();
  }
}
