import { Organization } from '../entity/organization.entity';

export const ORGANIZATION_REPOSITORY = Symbol('ORGANIZATION_REPOSITORY');

export interface OrgListFilters {
  search?: string;
  filter?: string;
  sortBy?: string;
  sortDir?: 'ASC' | 'DESC';
}

export interface OrganizationRepository {
  findById(id: string): Promise<Organization | null>;
  findByIds(ids: string[]): Promise<Organization[]>;
  findBySlug(slug: string): Promise<Organization | null>;
  findAll(page: number, limit: number, filters?: OrgListFilters): Promise<{ organizations: Organization[]; total: number; summary: { total: number; active: number; inactive: number } }>;
  save(org: Organization): Promise<void>;
  update(org: Organization): Promise<void>;
  delete(id: string): Promise<void>;
}
