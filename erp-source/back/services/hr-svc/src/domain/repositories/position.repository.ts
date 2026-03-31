import { Position } from '../entities/position.entity';

export interface PositionRepository {
  findById(id: string, tenantId: string): Promise<Position | null>;
  findByCode(code: string, tenantId: string): Promise<Position | null>;
  findByDepartment(departmentId: string, tenantId: string): Promise<Position[]>;
  findAll(tenantId: string): Promise<Position[]>;
  findActive(tenantId: string): Promise<Position[]>;
  save(position: Position): Promise<Position>;
  update(position: Position): Promise<Position>;
  existsByCode(code: string, tenantId: string): Promise<boolean>;
}

export const POSITION_REPOSITORY = Symbol('PositionRepository');
