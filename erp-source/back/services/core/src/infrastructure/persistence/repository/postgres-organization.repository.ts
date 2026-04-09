import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { OrganizationRepository, OrgListFilters } from '../../../domain/repository/organization.repository';
import { Organization, OrganizationStatus } from '../../../domain/entity/organization.entity';
import { OrganizationOrmEntity } from '../entity/organization.orm-entity';
import { FilterBuilder } from '../../filter/filter-builder';
import { ORGANIZATION_FILTERS, ORGANIZATION_SEARCH_COLUMNS } from '../../filter/filter-definitions';

@Injectable()
export class PostgresOrganizationRepository implements OrganizationRepository {
  private readonly logger = new Logger(PostgresOrganizationRepository.name);
  private readonly filterBuilder = FilterBuilder.for(ORGANIZATION_FILTERS, { logger: this.logger, context: PostgresOrganizationRepository.name });

  /** Whitelisted sort columns to prevent SQL injection via sort_by param. */
  private readonly ALLOWED_SORT: Record<string, string> = {
    name: 'o.name',
    slug: 'o.slug',
    status: 'o.status',
    created_at: 'o.created_at',
  };

  constructor(
    @InjectRepository(OrganizationOrmEntity)
    private readonly repo: Repository<OrganizationOrmEntity>,
  ) { }

  async findById(id: string): Promise<Organization | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    const row = await this.repo.findOne({ where: { slug } });
    return row ? this.toDomain(row) : null;
  }

  async findAll(
    page: number,
    limit: number,
    filters?: OrgListFilters,
  ): Promise<{ organizations: Organization[]; total: number; summary: { total: number; active: number; inactive: number } }> {
    const sortCol = (filters?.sortBy && this.ALLOWED_SORT[filters.sortBy]) ?? 'o.created_at';
    const sortDir = filters?.sortDir === 'ASC' ? 'ASC' : 'DESC';

    const qb = this.repo
      .createQueryBuilder('o')
      .orderBy(sortCol, sortDir);

    this.filterBuilder.applySearch(qb, 'o', filters?.search, ORGANIZATION_SEARCH_COLUMNS);
    this.filterBuilder.applyFilters(qb, 'o', filters?.filter);

    const [rows, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const summaryRows = await this.repo
      .createQueryBuilder('s')
      .select('s.status', 'status')
      .addSelect('COUNT(*)::int', 'count')
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
      organizations: rows.map((r) => this.toDomain(r)),
      total,
      summary: { total: summaryTotal, active: summaryActive, inactive: summaryInactive },
    };
  }

  async save(org: Organization): Promise<void> {
    const entity = this.repo.create({
      id: org.id,
      name: org.name,
      slug: org.slug,
      description: org.description,
      status: org.status,
      owner_id: org.ownerId,
      primary_color: org.primaryColor,
      secondary_color: org.secondaryColor,
      accent_color: org.accentColor,
      logo_url: org.logoUrl,
      favicon_url: org.faviconUrl,
      custom_css: org.customCss,
      settings: org.settings,
    });
    await this.repo.save(entity);
  }

  async update(org: Organization): Promise<void> {
    await this.repo.update(org.id, {
      name: org.name,
      slug: org.slug,
      description: org.description,
      status: org.status,
      owner_id: org.ownerId,
      primary_color: org.primaryColor,
      secondary_color: org.secondaryColor,
      accent_color: org.accentColor,
      logo_url: org.logoUrl,
      favicon_url: org.faviconUrl,
      custom_css: org.customCss,
      settings: org.settings,
    });
  }

  async findByIds(ids: string[]): Promise<Organization[]> {
    if (ids.length === 0) return [];
    const rows = await this.repo.find({ where: { id: In(ids) } });
    return rows.map((r) => this.toDomain(r));
  }

  async delete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }

  private toDomain(row: OrganizationOrmEntity): Organization {
    return Organization.reconstitute({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      status: row.status as OrganizationStatus,
      ownerId: row.owner_id,
      primaryColor: row.primary_color,
      secondaryColor: row.secondary_color,
      accentColor: row.accent_color,
      logoUrl: row.logo_url,
      faviconUrl: row.favicon_url,
      customCss: row.custom_css,
      settings: row.settings ?? {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
