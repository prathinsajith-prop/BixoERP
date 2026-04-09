import { Team } from '../entity/team.entity';
import { OrgEntityFilters, OrgEntitySummary } from './division.repository';

export const TEAM_REPOSITORY = Symbol('TEAM_REPOSITORY');

export interface TeamRepository {
  findById(tenantId: string, id: string): Promise<Team | null>;
  findByOrganization(tenantId: string, organizationId: string): Promise<Team[]>;
  findByOrganizationFiltered(tenantId: string, organizationId: string, page: number, limit: number, filters?: OrgEntityFilters): Promise<{ teams: Team[]; total: number; summary: OrgEntitySummary }>;
  findByDepartment(tenantId: string, departmentId: string): Promise<Team[]>;
  findByCode(tenantId: string, organizationId: string, code: string): Promise<Team | null>;
  save(team: Team): Promise<void>;
  update(team: Team): Promise<void>;
  delete(tenantId: string, id: string): Promise<void>;
}
