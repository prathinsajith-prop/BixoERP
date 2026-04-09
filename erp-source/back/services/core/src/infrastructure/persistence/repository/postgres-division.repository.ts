import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DivisionRepository, OrgEntityFilters, OrgEntitySummary } from '../../../domain/repository/division.repository';
import { Division } from '../../../domain/entity/division.entity';
import { DivisionOrmEntity } from '../entity/division.orm-entity';
import { FilterBuilder } from '../../filter/filter-builder';
import { DIVISION_FILTERS, DIVISION_SEARCH_COLUMNS } from '../../filter/filter-definitions';

@Injectable()
export class PostgresDivisionRepository implements DivisionRepository {
  private readonly logger = new Logger(PostgresDivisionRepository.name);
  private readonly filterBuilder = FilterBuilder.for(DIVISION_FILTERS, { logger: this.logger, context: PostgresDivisionRepository.name });

  /** Whitelisted sort columns to prevent SQL injection via sort_by param. */
  private readonly ALLOWED_SORT: Record<string, string> = {
    name: 'd.name',
    code: 'd.code',
    status: 'd.status',
    created_at: 'd.created_at',
  };

  constructor(
    @InjectRepository(DivisionOrmEntity)
    private readonly repo: Repository<DivisionOrmEntity>,
  ) { }

  async findById(tenantId: string, id: string): Promise<Division | null> {
    const row = await this.repo.findOne({ where: { id, tenant_id: tenantId } });
    return row ? this.toDomain(row) : null;
  }

  async findByOrganization(tenantId: string, organizationId: string): Promise<Division[]> {
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
  ): Promise<{ divisions: Division[]; total: number; summary: OrgEntitySummary }> {
    const sortCol = (filters?.sortBy && this.ALLOWED_SORT[filters.sortBy]) ?? 'd.name';
    const sortDir = filters?.sortDir === 'DESC' ? 'DESC' : 'ASC';

    const qb = this.repo
      .createQueryBuilder('d')
      .where('d.tenant_id = :tenantId', { tenantId })
      .andWhere('d.organization_id = :organizationId', { organizationId })
      .orderBy(sortCol, sortDir);

    this.filterBuilder.applySearch(qb, 'd', filters?.search, DIVISION_SEARCH_COLUMNS);
    this.filterBuilder.applyFilters(qb, 'd', filters?.filter);

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
      divisions: rows.map((r) => this.toDomain(r)),
      total,
      summary: { total: summaryTotal, active: summaryActive, inactive: summaryInactive },
    };
  }

  async findByCode(tenantId: string, organizationId: string, code: string): Promise<Division | null> {
    const row = await this.repo.findOne({
      where: { tenant_id: tenantId, organization_id: organizationId, code },
    });
    return row ? this.toDomain(row) : null;
  }

  async save(div: Division): Promise<void> {
    await this.repo.insert(this.toOrm(div));
  }

  async update(div: Division): Promise<void> {
    await this.repo.update({ id: div.id, tenant_id: div.tenantId }, this.toOrm(div));
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.repo.softDelete({ id, tenant_id: tenantId });
  }

  private toDomain(orm: DivisionOrmEntity): Division {
    return Division.reconstitute({
      id: orm.id,
      tenantId: orm.tenant_id,
      organizationId: orm.organization_id,
      name: orm.name,
      code: orm.code,
      description: orm.description,
      headUserId: orm.head_user_id,
      status: orm.status as 'ACTIVE' | 'INACTIVE',
      createdAt: orm.created_at,
      updatedAt: orm.updated_at,
    });
  }

  private toOrm(div: Division): Partial<DivisionOrmEntity> {
    return {
      id: div.id,
      tenant_id: div.tenantId,
      organization_id: div.organizationId,
      name: div.name,
      code: div.code,
      description: div.description,
      head_user_id: div.headUserId,
      status: div.status,
    };
  }
}
