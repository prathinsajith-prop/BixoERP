import { Permission } from '../entity/permission.entity';

export const PERMISSION_REPOSITORY = Symbol('PERMISSION_REPOSITORY');

export interface PermissionRepository {
  findById(tenantId: string, id: string): Promise<Permission | null>;
  findByIds(tenantId: string, ids: string[]): Promise<Permission[]>;
  findByResource(tenantId: string, resource: string): Promise<Permission[]>;
  findByTenant(tenantId: string): Promise<Permission[]>;
  save(permission: Permission): Promise<void>;
  delete(tenantId: string, id: string): Promise<void>;
}
