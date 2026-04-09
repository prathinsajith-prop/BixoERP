import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeamRepository } from '../../../domain/repository/team.repository';
import { OrgEntityFilters, OrgEntitySummary } from '../../../domain/repository/division.repository';
import { Team } from '../../../domain/entity/team.entity';
import { TeamOrmEntity } from '../entity/team.orm-entity';
import { FilterBuilder } from '../../filter/filter-builder';
import { TEAM_FILTERS, TEAM_SEARCH_COLUMNS } from '../../filter/filter-definitions';

@Injectable()
export class PostgresTeamRepository implements TeamRepository {
  private readonly logger = new Logger(PostgresTeamRepository.name);
  private readonly filterBuilder = FilterBuilder.for(TEAM_FILTERS, { logger: this.logger, context: PostgresTeamRepository.name });

  /** Whitelisted sort columns to prevent SQL injection via sort_by param. */
  private readonly ALLOWED_SORT: Record<string, string> = {
    name: 't.name',
    code: 't.code',
    status: 't.status',
    created_at: 't.created_at',
  };

  constructor(
    @InjectRepository(TeamOrmEntity)
    private readonly repo: Repository<TeamOrmEntity>,
  ) { }

  async findById(tenantId: string, id: string): Promise<Team | null> {
    const row = await this.repo.findOne({ where: { id, tenant_id: tenantId } });
    return row ? this.toDomain(row) : null;
  }

  async findByOrganization(tenantId: string, organizationId: string): Promise<Team[]> {
    const rows = await this.repo.find({
      where: { tenant_id: tenantId, organization_id: organizationId },
      order: { name: 'ASC' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findByOrganizationFiltered(
    tenantId: string,
    organizationId: string,
    page: number,
    limit: number,
    filters?: OrgEntityFilters,
  ): Promise<{ teams: Team[]; total: number; summary: OrgEntitySummary }> {
    const sortCol = (filters?.sortBy && this.ALLOWED_SORT[filters.sortBy]) ?? 't.name';
    const sortDir = filters?.sortDir === 'DESC' ? 'DESC' : 'ASC';

    const qb = this.repo
      .createQueryBuilder('t')
      .where('t.tenant_id = :tenantId', { tenantId })
      .andWhere('t.organization_id = :organizationId', { organizationId })
      .orderBy(sortCol, sortDir);

    this.filterBuilder.applySearch(qb, 't', filters?.search, TEAM_SEARCH_COLUMNS);
    this.filterBuilder.applyFilters(qb, 't', filters?.filter);

    const [rows, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const summaryRows = await this.repo
      .createQueryBuilder('s')
      .select('s.status', 'status')
      .addSelect('COUNT(*)::int', 'count')
      .where('s.tenant_id = :tenantId', { tenantId })
      .andWhere('s.organization_id = :organizationId', { organizationId })
      .groupBy('s.status')
      .getRawMany<{ status: string; count: number }>();

    let summaryTotal = 0;
    let summaryActive = 0;
    let summaryInactive = 0;
    for (const row of summaryRows) {
      const c = Number(row.count);
      summaryTotal += c;
      if (row.status === 'ACTIVE') summaryActive = c;
      if (row.status === 'INACTIVE') summaryInactive = c;
    }

    return {
      teams: rows.map((r) => this.toDomain(r)),
      total,
      summary: { total: summaryTotal, active: summaryActive, inactive: summaryInactive },
    };
  }

  async findByDepartment(tenantId: string, departmentId: string): Promise<Team[]> {
    const rows = await this.repo.find({
      where: { tenant_id: tenantId, department_id: departmentId },
      order: { name: 'ASC' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findByCode(tenantId: string, organizationId: string, code: string): Promise<Team | null> {
    const row = await this.repo.findOne({
      where: { tenant_id: tenantId, organization_id: organizationId, code },
    });
    return row ? this.toDomain(row) : null;
  }

  async save(team: Team): Promise<void> {
    await this.repo.insert(this.toOrm(team));
  }

  async update(team: Team): Promise<void> {
    await this.repo.update({ id: team.id, tenant_id: team.tenantId }, this.toOrm(team));
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.repo.softDelete({ id, tenant_id: tenantId });
  }

  private toDomain(orm: TeamOrmEntity): Team {
    return Team.reconstitute({
      id: orm.id,
      tenantId: orm.tenant_id,
      organizationId: orm.organization_id,
      departmentId: orm.department_id,
      name: orm.name,
      code: orm.code,
      description: orm.description,
      leadUserId: orm.lead_user_id,
      status: orm.status as 'ACTIVE' | 'INACTIVE',
      createdAt: orm.created_at,
      updatedAt: orm.updated_at,
    });
  }

  private toOrm(team: Team): Partial<TeamOrmEntity> {
    return {
      id: team.id,
      tenant_id: team.tenantId,
      organization_id: team.organizationId,
      department_id: team.departmentId,
      name: team.name,
      code: team.code,
      description: team.description,
      lead_user_id: team.leadUserId,
      status: team.status,
    };
  }
}
