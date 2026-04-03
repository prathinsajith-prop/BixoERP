import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DepartmentRepository } from '../../../domain/repository/department.repository';
import { Department } from '../../../domain/entity/department.entity';
import { DepartmentOrmEntity } from '../entity/department.orm-entity';

@Injectable()
export class PostgresDepartmentRepository implements DepartmentRepository {
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
