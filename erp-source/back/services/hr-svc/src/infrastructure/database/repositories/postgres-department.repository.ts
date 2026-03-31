import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department, DepartmentProps } from '../../../domain/entities/department.entity';
import { DepartmentRepository } from '../../../domain/repositories/department.repository';
import { DepartmentOrmEntity } from '../entities/department.orm-entity';

@Injectable()
export class PostgresDepartmentRepository implements DepartmentRepository {
  constructor(
    @InjectRepository(DepartmentOrmEntity) private readonly repo: Repository<DepartmentOrmEntity>,
  ) {}

  async findById(id: string, tenantId: string): Promise<Department | null> {
    const row = await this.repo.findOne({ where: { id, tenantId } });
    return row ? this.toDomain(row) : null;
  }

  async findByCode(code: string, tenantId: string): Promise<Department | null> {
    const row = await this.repo.findOne({ where: { code, tenantId } });
    return row ? this.toDomain(row) : null;
  }

  async findAll(tenantId: string): Promise<Department[]> {
    const rows = await this.repo.find({ where: { tenantId }, order: { name: 'ASC' } });
    return rows.map((r) => this.toDomain(r));
  }

  async findActive(tenantId: string): Promise<Department[]> {
    const rows = await this.repo.find({ where: { tenantId, isActive: true }, order: { name: 'ASC' } });
    return rows.map((r) => this.toDomain(r));
  }

  async save(department: Department): Promise<Department> {
    const entity = this.toOrm(department);
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  async update(department: Department): Promise<Department> {
    return this.save(department);
  }

  async existsByCode(code: string, tenantId: string): Promise<boolean> {
    const count = await this.repo.count({ where: { code, tenantId } });
    return count > 0;
  }

  async count(tenantId: string): Promise<number> {
    return this.repo.count({ where: { tenantId } });
  }

  private toDomain(row: DepartmentOrmEntity): Department {
    return Department.fromPersistence(
      {
        code: row.code,
        name: row.name,
        parentId: row.parentId,
        managerId: row.managerId,
        isActive: row.isActive,
        tenantId: row.tenantId,
        description: row.description,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }

  private toOrm(dept: Department): DepartmentOrmEntity {
    const entity = new DepartmentOrmEntity();
    entity.id = dept.id;
    entity.code = dept.code;
    entity.name = dept.name;
    entity.parentId = dept.parentId;
    entity.managerId = dept.managerId;
    entity.isActive = dept.isActive;
    entity.tenantId = dept.tenantId;
    entity.description = dept.description;
    entity.createdAt = dept.createdAt;
    entity.updatedAt = dept.updatedAt;
    return entity;
  }
}
