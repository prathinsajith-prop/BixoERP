import { Division } from '../entity/division.entity';

export const DIVISION_REPOSITORY = Symbol('DIVISION_REPOSITORY');

export interface DivisionRepository {
  findById(tenantId: string, id: string): Promise<Division | null>;
  findByOrganization(tenantId: string, organizationId: string): Promise<Division[]>;
  findByCode(tenantId: string, organizationId: string, code: string): Promise<Division | null>;
  save(div: Division): Promise<void>;
  update(div: Division): Promise<void>;
  delete(tenantId: string, id: string): Promise<void>;
}
