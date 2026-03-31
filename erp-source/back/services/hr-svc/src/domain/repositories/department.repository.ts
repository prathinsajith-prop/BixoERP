import { Department } from '../entities/department.entity';

export interface DepartmentRepository {
  findById(id: string, tenantId: string): Promise<Department | null>;
  findByCode(code: string, tenantId: string): Promise<Department | null>;
  findAll(tenantId: string): Promise<Department[]>;
  findActive(tenantId: string): Promise<Department[]>;
  save(department: Department): Promise<Department>;
  update(department: Department): Promise<Department>;
  existsByCode(code: string, tenantId: string): Promise<boolean>;
  count(tenantId: string): Promise<number>;
}

export const DEPARTMENT_REPOSITORY = Symbol('DepartmentRepository');
