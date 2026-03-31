import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationRepository } from '../../../domain/repository/organization.repository';
import { Organization, OrganizationStatus } from '../../../domain/entity/organization.entity';
import { OrganizationOrmEntity } from '../entity/organization.orm-entity';

@Injectable()
export class PostgresOrganizationRepository implements OrganizationRepository {
  constructor(
    @InjectRepository(OrganizationOrmEntity)
    private readonly repo: Repository<OrganizationOrmEntity>,
  ) {}

  async findById(id: string): Promise<Organization | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    const row = await this.repo.findOne({ where: { slug } });
    return row ? this.toDomain(row) : null;
  }

  async findAll(page: number, limit: number): Promise<{ organizations: Organization[]; total: number }> {
    const [rows, total] = await this.repo.findAndCount({
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { organizations: rows.map((r) => this.toDomain(r)), total };
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

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
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
