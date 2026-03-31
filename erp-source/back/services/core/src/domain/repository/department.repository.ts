import { Department } from '../entity/department.entity';

export const DEPARTMENT_REPOSITORY = Symbol('DEPARTMENT_REPOSITORY');

export interface DepartmentRepository {
  findById(tenantId: string, id: string): Promise<Department | null>;
  findByOrganization(tenantId: string, organizationId: string): Promise<Department[]>;
  findByCode(tenantId: string, organizationId: string, code: string): Promise<Department | null>;
  save(dept: Department): Promise<void>;
  update(dept: Department): Promise<void>;
  delete(tenantId: string, id: string): Promise<void>;
}
