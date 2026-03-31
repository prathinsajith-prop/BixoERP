import { Organization } from '../entity/organization.entity';

export const ORGANIZATION_REPOSITORY = Symbol('ORGANIZATION_REPOSITORY');

export interface OrganizationRepository {
  findById(id: string): Promise<Organization | null>;
  findBySlug(slug: string): Promise<Organization | null>;
  findAll(page: number, limit: number): Promise<{ organizations: Organization[]; total: number }>;
  save(org: Organization): Promise<void>;
  update(org: Organization): Promise<void>;
  delete(id: string): Promise<void>;
}
