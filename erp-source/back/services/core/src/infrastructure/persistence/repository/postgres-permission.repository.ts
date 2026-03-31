import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PermissionRepository } from '../../../domain/repository/permission.repository';
import { Permission } from '../../../domain/entity/permission.entity';
import { PermissionOrmEntity } from '../entity/permission.orm-entity';

@Injectable()
export class PostgresPermissionRepository implements PermissionRepository {
  constructor(
    @InjectRepository(PermissionOrmEntity)
    private readonly repo: Repository<PermissionOrmEntity>,
  ) {}

  async findById(tenantId: string, id: string): Promise<Permission | null> {
    const row = await this.repo.findOne({ where: { id, tenant_id: tenantId } });
    return row ? this.toDomain(row) : null;
  }

  async findByIds(tenantId: string, ids: string[]): Promise<Permission[]> {
    if (ids.length === 0) return [];
    const rows = await this.repo.find({ where: { tenant_id: tenantId, id: In(ids) } });
    return rows.map((r) => this.toDomain(r));
  }

  async findByResource(tenantId: string, resource: string): Promise<Permission[]> {
    const rows = await this.repo.find({ where: { tenant_id: tenantId, resource } });
    return rows.map((r) => this.toDomain(r));
  }

  async findByTenant(tenantId: string): Promise<Permission[]> {
    const rows = await this.repo.find({ where: { tenant_id: tenantId }, order: { resource: 'ASC', action: 'ASC' } });
    return rows.map((r) => this.toDomain(r));
  }

  async save(permission: Permission): Promise<void> {
    await this.repo.insert(this.toOrm(permission));
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.repo.delete({ id, tenant_id: tenantId });
  }

  private toDomain(orm: PermissionOrmEntity): Permission {
    return Permission.reconstitute({
      id: orm.id,
      tenantId: orm.tenant_id,
      resource: orm.resource,
      action: orm.action,
      description: orm.description,
      createdAt: orm.created_at,
      updatedAt: orm.updated_at,
    });
  }

  private toOrm(p: Permission): Partial<PermissionOrmEntity> {
    return {
      id: p.id,
      tenant_id: p.tenantId,
      resource: p.resource,
      action: p.action,
      description: p.description,
    };
  }
}
