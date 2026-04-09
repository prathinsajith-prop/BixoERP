import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DepartmentRepository } from '../../../domain/repository/department.repository';
import { OrgEntityFilters, OrgEntitySummary } from '../../../domain/repository/division.repository';
import { Department } from '../../../domain/entity/department.entity';
import { DepartmentOrmEntity } from '../entity/department.orm-entity';
import { FilterBuilder } from '../../filter/filter-builder';
import { DEPARTMENT_FILTERS, DEPARTMENT_SEARCH_COLUMNS } from '../../filter/filter-definitions';

@Injectable()
export class PostgresDepartmentRepository implements DepartmentRepository {
  private readonly logger = new Logger(PostgresDepartmentRepository.name);
  private readonly filterBuilder = FilterBuilder.for(DEPARTMENT_FILTERS, { logger: this.logger, context: PostgresDepartmentRepository.name });

  /** Whitelisted sort columns to prevent SQL injection via sort_by param. */
  private readonly ALLOWED_SORT: Record<string, string> = {
    name: 'd.name',
    code: 'd.code',
    status: 'd.status',
    created_at: 'd.created_at',
  };

  constructor(
    @InjectRepository(DepartmentOrmEntity)
    private readonly repo: Repository<DepartmentOrmEntity>,
  ) { }

  async findById(tenantId: string, id: string): Promise<Department | null> {
    const row = await this.repo.findOne({ where: { id, tenant_id: tenantId } });
    return row ? this.toDomain(row) : null;
  }

  async findByOrganization(tenantId: string, organizationId: string): Promise<Department[]> {
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
  ): Promise<{ departments: Department[]; total: number; summary: OrgEntitySummary }> {
    const sortCol = (filters?.sortBy && this.ALLOWED_SORT[filters.sortBy]) ?? 'd.name';
    const sortDir = filters?.sortDir === 'DESC' ? 'DESC' : 'ASC';

    const qb = this.repo
      .createQueryBuilder('d')
      .where('d.tenant_id = :tenantId', { tenantId })
      .andWhere('d.organization_id = :organizationId', { organizationId })
      .orderBy(sortCol, sortDir);

    this.filterBuilder.applySearch(qb, 'd', filters?.search, DEPARTMENT_SEARCH_COLUMNS);
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
      departments: rows.map((r) => this.toDomain(r)),
      total,
      summary: { total: summaryTotal, active: summaryActive, inactive: summaryInactive },
    };
  }

  async findByCode(tenantId: string, organizationId: string, code: string): Promise<Department | null> {
    const row = await this.repo.findOne({
      where: { tenant_id: tenantId, organization_id: organizationId, code },
    });
    return row ? this.toDomain(row) : null;
  }

  async save(dept: Department): Promise<void> {
    await this.repo.insert(this.toOrm(dept));
  }

  async update(dept: Department): Promise<void> {
    await this.repo.update({ id: dept.id, tenant_id: dept.tenantId }, this.toOrm(dept));
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.repo.softDelete({ id, tenant_id: tenantId });
  }

  private toDomain(orm: DepartmentOrmEntity): Department {
    return Department.reconstitute({
      id: orm.id,
      tenantId: orm.tenant_id,
      organizationId: orm.organization_id,
      divisionId: orm.division_id,
      name: orm.name,
      code: orm.code,
      description: orm.description,
      headUserId: orm.head_user_id,
      status: orm.status as 'ACTIVE' | 'INACTIVE',
      createdAt: orm.created_at,
      updatedAt: orm.updated_at,
    });
  }

  private toOrm(dept: Department): Partial<DepartmentOrmEntity> {
    return {
      id: dept.id,
      tenant_id: dept.tenantId,
      organization_id: dept.organizationId,
      division_id: dept.divisionId,
      name: dept.name,
      code: dept.code,
      description: dept.description,
      head_user_id: dept.headUserId,
      status: dept.status,
    };
  }
}
