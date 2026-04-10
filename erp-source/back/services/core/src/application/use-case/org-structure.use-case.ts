import { Inject, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DEPARTMENT_REPOSITORY, DepartmentRepository } from '../../domain/repository/department.repository';
import { DIVISION_REPOSITORY, DivisionRepository } from '../../domain/repository/division.repository';
import { OrgEntityFilters, OrgEntitySummary } from '../../domain/repository/division.repository';
import { TEAM_REPOSITORY, TeamRepository } from '../../domain/repository/team.repository';
import { Department } from '../../domain/entity/department.entity';
import { Division } from '../../domain/entity/division.entity';
import { Team } from '../../domain/entity/team.entity';

@Injectable()
export class OrgStructureUseCase {
  constructor(
    @Inject(DEPARTMENT_REPOSITORY) private readonly deptRepo: DepartmentRepository,
    @Inject(DIVISION_REPOSITORY) private readonly divRepo: DivisionRepository,
    @Inject(TEAM_REPOSITORY) private readonly teamRepo: TeamRepository,
  ) { }

  // ─── Divisions ────────────────────────────────────────────

  async createDivision(cmd: {
    tenantId: string;
    organizationId: string;
    name: string;
    code: string;
    description: string;
    headUserId: string | null;
  }): Promise<Division> {
    const existing = await this.divRepo.findByCode(cmd.tenantId, cmd.organizationId, cmd.code);
    if (existing) throw new ConflictException('Division code already exists');

    const div = Division.create(cmd.tenantId, cmd.organizationId, cmd.name, cmd.code);
    div.description = cmd.description;
    div.headUserId = cmd.headUserId;
    await this.divRepo.save(div);
    return div;
  }

  async listDivisions(tenantId: string, organizationId: string): Promise<Division[]> {
    return this.divRepo.findByOrganization(tenantId, organizationId);
  }

  async listDivisionsFiltered(
    tenantId: string,
    organizationId: string,
    page: number,
    limit: number,
    filters?: OrgEntityFilters,
  ): Promise<{ divisions: Division[]; total: number; summary: OrgEntitySummary }> {
    return this.divRepo.findByOrganizationFiltered(tenantId, organizationId, page, limit, filters);
  }

  async getDivision(tenantId: string, id: string): Promise<Division> {
    const div = await this.divRepo.findById(tenantId, id);
    if (!div) throw new NotFoundException('Division not found');
    return div;
  }

  async updateDivision(tenantId: string, id: string, fields: {
    name?: string; code?: string; description?: string; headUserId?: string | null; status?: 'ACTIVE' | 'INACTIVE';
  }) {
    const div = await this.divRepo.findById(tenantId, id);
    if (!div) throw new NotFoundException('Division not found');

    if (fields.code && fields.code !== div.code) {
      const dup = await this.divRepo.findByCode(tenantId, div.organizationId, fields.code);
      if (dup) throw new ConflictException('Division code already exists');
    }

    div.update(fields);
    await this.divRepo.update(div);
    return div;
  }

  async deleteDivision(tenantId: string, id: string): Promise<void> {
    const div = await this.divRepo.findById(tenantId, id);
    if (!div) throw new NotFoundException('Division not found');
    await this.divRepo.delete(tenantId, id);
  }

  // ─── Departments ──────────────────────────────────────────

  async createDepartment(cmd: {
    tenantId: string;
    organizationId: string;
    name: string;
    code: string;
    description: string;
    divisionId: string | null;
    headUserId: string | null;
  }): Promise<Department> {
    const existing = await this.deptRepo.findByCode(cmd.tenantId, cmd.organizationId, cmd.code);
    if (existing) throw new ConflictException('Department code already exists');

    const dept = Department.create(cmd.tenantId, cmd.organizationId, cmd.name, cmd.code);
    dept.description = cmd.description;
    dept.divisionId = cmd.divisionId;
    dept.headUserId = cmd.headUserId;
    await this.deptRepo.save(dept);
    return dept;
  }

  async listDepartments(tenantId: string, organizationId: string): Promise<Department[]> {
    return this.deptRepo.findByOrganization(tenantId, organizationId);
  }

  async listDepartmentsFiltered(
    tenantId: string,
    organizationId: string,
    page: number,
    limit: number,
    filters?: OrgEntityFilters,
  ): Promise<{ departments: Department[]; total: number; summary: OrgEntitySummary }> {
    return this.deptRepo.findByOrganizationFiltered(tenantId, organizationId, page, limit, filters);
  }

  async getDepartment(tenantId: string, id: string): Promise<Department> {
    const dept = await this.deptRepo.findById(tenantId, id);
    if (!dept) throw new NotFoundException('Department not found');
    return dept;
  }

  async updateDepartment(tenantId: string, id: string, fields: {
    name?: string; code?: string; description?: string; divisionId?: string | null; headUserId?: string | null; status?: 'ACTIVE' | 'INACTIVE';
  }) {
    const dept = await this.deptRepo.findById(tenantId, id);
    if (!dept) throw new NotFoundException('Department not found');

    if (fields.code && fields.code !== dept.code) {
      const dup = await this.deptRepo.findByCode(tenantId, dept.organizationId, fields.code);
      if (dup) throw new ConflictException('Department code already exists');
    }

    dept.update(fields);
    await this.deptRepo.update(dept);
    return dept;
  }

  async deleteDepartment(tenantId: string, id: string): Promise<void> {
    const dept = await this.deptRepo.findById(tenantId, id);
    if (!dept) throw new NotFoundException('Department not found');
    await this.deptRepo.delete(tenantId, id);
  }

  // ─── Teams ────────────────────────────────────────────────

  async createTeam(cmd: {
    tenantId: string;
    organizationId: string;
    name: string;
    code: string;
    description: string;
    departmentId: string | null;
    leadUserId: string | null;
  }): Promise<Team> {
    const existing = await this.teamRepo.findByCode(cmd.tenantId, cmd.organizationId, cmd.code);
    if (existing) throw new ConflictException('Team code already exists');

    const team = Team.create(cmd.tenantId, cmd.organizationId, cmd.name, cmd.code);
    team.description = cmd.description;
    team.departmentId = cmd.departmentId;
    team.leadUserId = cmd.leadUserId;
    await this.teamRepo.save(team);
    return team;
  }

  async listTeams(tenantId: string, organizationId: string): Promise<Team[]> {
    return this.teamRepo.findByOrganization(tenantId, organizationId);
  }

  async listTeamsFiltered(
    tenantId: string,
    organizationId: string,
    page: number,
    limit: number,
    filters?: OrgEntityFilters,
  ): Promise<{ teams: Team[]; total: number; summary: OrgEntitySummary }> {
    return this.teamRepo.findByOrganizationFiltered(tenantId, organizationId, page, limit, filters);
  }

  async listTeamsByDepartment(tenantId: string, departmentId: string): Promise<Team[]> {
    return this.teamRepo.findByDepartment(tenantId, departmentId);
  }

  async getTeam(tenantId: string, id: string): Promise<Team> {
    const team = await this.teamRepo.findById(tenantId, id);
    if (!team) throw new NotFoundException('Team not found');
    return team;
  }

  async updateTeam(tenantId: string, id: string, fields: {
    name?: string; code?: string; description?: string; departmentId?: string | null; leadUserId?: string | null; status?: 'ACTIVE' | 'INACTIVE';
  }) {
    const team = await this.teamRepo.findById(tenantId, id);
    if (!team) throw new NotFoundException('Team not found');

    if (fields.code && fields.code !== team.code) {
      const dup = await this.teamRepo.findByCode(tenantId, team.organizationId, fields.code);
      if (dup) throw new ConflictException('Team code already exists');
    }

    team.update(fields);
    await this.teamRepo.update(team);
    return team;
  }

  async deleteTeam(tenantId: string, id: string): Promise<void> {
    const team = await this.teamRepo.findById(tenantId, id);
    if (!team) throw new NotFoundException('Team not found');
    await this.teamRepo.delete(tenantId, id);
  }

  // ─── Full Org Structure ───────────────────────────────────

  async getFullStructure(tenantId: string, organizationId: string) {
    const [divisions, departments, teams] = await Promise.all([
      this.divRepo.findByOrganization(tenantId, organizationId),
      this.deptRepo.findByOrganization(tenantId, organizationId),
      this.teamRepo.findByOrganization(tenantId, organizationId),
    ]);
    return { divisions, departments, teams };
  }
}
