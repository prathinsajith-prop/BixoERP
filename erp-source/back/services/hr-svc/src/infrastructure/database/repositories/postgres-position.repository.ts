import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Position, PositionProps } from '../../../domain/entities/position.entity';
import { PositionRepository } from '../../../domain/repositories/position.repository';
import { PositionOrmEntity } from '../entities/position.orm-entity';
import { Money } from '../../../domain/value-objects/money';

@Injectable()
export class PostgresPositionRepository implements PositionRepository {
  constructor(
    @InjectRepository(PositionOrmEntity) private readonly repo: Repository<PositionOrmEntity>,
  ) {}

  async findById(id: string, tenantId: string): Promise<Position | null> {
    const row = await this.repo.findOne({ where: { id, tenantId } });
    return row ? this.toDomain(row) : null;
  }

  async findByCode(code: string, tenantId: string): Promise<Position | null> {
    const row = await this.repo.findOne({ where: { code, tenantId } });
    return row ? this.toDomain(row) : null;
  }

  async findByDepartment(departmentId: string, tenantId: string): Promise<Position[]> {
    const rows = await this.repo.find({ where: { departmentId, tenantId }, order: { title: 'ASC' } });
    return rows.map((r) => this.toDomain(r));
  }

  async findAll(tenantId: string): Promise<Position[]> {
    const rows = await this.repo.find({ where: { tenantId }, order: { title: 'ASC' } });
    return rows.map((r) => this.toDomain(r));
  }

  async findActive(tenantId: string): Promise<Position[]> {
    const rows = await this.repo.find({ where: { tenantId, isActive: true }, order: { title: 'ASC' } });
    return rows.map((r) => this.toDomain(r));
  }

  async save(position: Position): Promise<Position> {
    const entity = this.toOrm(position);
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  async update(position: Position): Promise<Position> {
    return this.save(position);
  }

  async existsByCode(code: string, tenantId: string): Promise<boolean> {
    const count = await this.repo.count({ where: { code, tenantId } });
    return count > 0;
  }

  private toDomain(row: PositionOrmEntity): Position {
    return Position.fromPersistence(
      {
        code: row.code,
        title: row.title,
        departmentId: row.departmentId,
        minSalary: Money.create(row.minSalary, row.currency),
        maxSalary: Money.create(row.maxSalary, row.currency),
        currency: row.currency,
        isActive: row.isActive,
        tenantId: row.tenantId,
        description: row.description,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }

  private toOrm(pos: Position): PositionOrmEntity {
    const entity = new PositionOrmEntity();
    entity.id = pos.id;
    entity.code = pos.code;
    entity.title = pos.title;
    entity.departmentId = pos.departmentId;
    entity.minSalary = pos.minSalary.amount;
    entity.maxSalary = pos.maxSalary.amount;
    entity.currency = pos.currency;
    entity.isActive = pos.isActive;
    entity.tenantId = pos.tenantId;
    entity.description = pos.description;
    entity.createdAt = pos.createdAt;
    entity.updatedAt = pos.updatedAt;
    return entity;
  }
}
