import { User } from '../entity/user.entity';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface UserRepository {
  findById(tenantId: string, id: string): Promise<User | null>;
  findByEmail(tenantId: string, email: string): Promise<User | null>;
  findByEmailGlobal(email: string): Promise<User | null>;
  findByTenant(tenantId: string, page: number, limit: number): Promise<{ users: User[]; total: number }>;
  save(user: User): Promise<void>;
  update(user: User): Promise<void>;
  delete(tenantId: string, id: string): Promise<void>;
}
