import { Division } from '../entity/division.entity';

export const DIVISION_REPOSITORY = Symbol('DIVISION_REPOSITORY');

export interface OrgEntityFilters {
  search?: string;
  filter?: string;
  /** Column key as sent by the client (e.g. "name", "code", "status", "created_at"). */
  sortBy?: string;
  /** Sort direction — defaults to ASC when omitted. */
  sortDir?: 'ASC' | 'DESC';
}

export interface OrgEntitySummary {
  total: number;
  active: number;
  inactive: number;
}

export interface DivisionRepository {
  findById(tenantId: string, id: string): Promise<Division | null>;
  findByOrganization(tenantId: string, organizationId: string): Promise<Division[]>;
  findByOrganizationFiltered(tenantId: string, organizationId: string, page: number, limit: number, filters?: OrgEntityFilters): Promise<{ divisions: Division[]; total: number; summary: OrgEntitySummary }>;
  findByCode(tenantId: string, organizationId: string, code: string): Promise<Division | null>;
  save(div: Division): Promise<void>;
  update(div: Division): Promise<void>;
  delete(tenantId: string, id: string): Promise<void>;
}
