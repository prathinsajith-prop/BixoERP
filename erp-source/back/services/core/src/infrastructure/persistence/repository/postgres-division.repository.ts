import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DivisionRepository } from '../../../domain/repository/division.repository';
import { Division } from '../../../domain/entity/division.entity';
import { DivisionOrmEntity } from '../entity/division.orm-entity';

@Injectable()
export class PostgresDivisionRepository implements DivisionRepository {
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
