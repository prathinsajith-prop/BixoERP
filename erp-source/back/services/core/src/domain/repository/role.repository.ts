import { Role } from '../entity/role.entity';

export const ROLE_REPOSITORY = Symbol('ROLE_REPOSITORY');

export interface RoleRepository {
  findById(tenantId: string, id: string): Promise<Role | null>;
  findByName(tenantId: string, name: string): Promise<Role | null>;
  findByIds(tenantId: string, ids: string[]): Promise<Role[]>;
  findByTenant(tenantId: string): Promise<Role[]>;
  save(role: Role): Promise<void>;
  update(role: Role): Promise<void>;
  delete(tenantId: string, id: string): Promise<void>;
}
