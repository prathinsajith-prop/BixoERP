import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { RoleRepository } from '../../../domain/repository/role.repository';
import { Role } from '../../../domain/entity/role.entity';
import { RoleOrmEntity } from '../entity/role.orm-entity';

@Injectable()
export class PostgresRoleRepository implements RoleRepository {
  constructor(
    @InjectRepository(RoleOrmEntity)
    private readonly repo: Repository<RoleOrmEntity>,
  ) { }

  async findById(tenantId: string, id: string): Promise<Role | null> {
    const row = await this.repo.findOne({ where: { id, tenant_id: tenantId } });
    return row ? this.toDomain(row) : null;
  }

  async findByName(tenantId: string, name: string): Promise<Role | null> {
    const row = await this.repo.findOne({ where: { tenant_id: tenantId, name } });
    return row ? this.toDomain(row) : null;
  }

  async findByIds(tenantId: string, ids: string[]): Promise<Role[]> {
    if (ids.length === 0) return [];
    const rows = await this.repo.find({ where: { tenant_id: tenantId, id: In(ids) } });
    return rows.map((r) => this.toDomain(r));
  }

  async findByTenant(tenantId: string): Promise<Role[]> {
    const rows = await this.repo.find({ where: { tenant_id: tenantId }, order: { name: 'ASC' } });
    return rows.map((r) => this.toDomain(r));
  }

  async save(role: Role): Promise<void> {
    await this.repo.insert(this.toOrm(role));
  }

  async update(role: Role): Promise<void> {
    await this.repo.update({ id: role.id, tenant_id: role.tenantId }, this.toOrm(role));
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.repo.softDelete({ id, tenant_id: tenantId });
  }

  private toDomain(orm: RoleOrmEntity): Role {
    return Role.reconstitute({
      id: orm.id,
      tenantId: orm.tenant_id,
      name: orm.name,
      description: orm.description,
      permissions: orm.permissions ?? [],
      isSystem: orm.is_system,
      createdAt: orm.created_at,
      updatedAt: orm.updated_at,
    });
  }

  private toOrm(role: Role): Partial<RoleOrmEntity> {
    return {
      id: role.id,
      tenant_id: role.tenantId,
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      is_system: role.isSystem,
    };
  }
}
