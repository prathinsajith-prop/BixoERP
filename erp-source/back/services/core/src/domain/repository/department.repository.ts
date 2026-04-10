import { Department } from '../entity/department.entity';
import { OrgEntityFilters, OrgEntitySummary } from './division.repository';

export const DEPARTMENT_REPOSITORY = Symbol('DEPARTMENT_REPOSITORY');

export interface DepartmentRepository {
  findById(tenantId: string, id: string): Promise<Department | null>;
  findByOrganization(tenantId: string, organizationId: string): Promise<Department[]>;
  findByOrganizationFiltered(tenantId: string, organizationId: string, page: number, limit: number, filters?: OrgEntityFilters): Promise<{ departments: Department[]; total: number; summary: OrgEntitySummary }>;
  findByCode(tenantId: string, organizationId: string, code: string): Promise<Department | null>;
  save(dept: Department): Promise<void>;
  update(dept: Department): Promise<void>;
  delete(tenantId: string, id: string): Promise<void>;
}
