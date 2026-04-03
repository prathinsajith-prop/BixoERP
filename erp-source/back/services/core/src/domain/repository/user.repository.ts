import { User } from '../entity/user.entity';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface UserRepository {
  findById(tenantId: string, id: string): Promise<User | null>;
  findByIdGlobal(id: string): Promise<User | null>;
  findByEmail(tenantId: string, email: string): Promise<User | null>;
  findByEmailGlobal(email: string): Promise<User | null>;
  findByTenant(tenantId: string, page: number, limit: number): Promise<{ users: User[]; total: number }>;
  save(user: User): Promise<void>;
  update(user: User): Promise<void>;
  /** Update only last_login_at and reset failed_login_attempts WITHOUT touching updated_at. */
  updateLastLogin(userId: string, lastLoginAt: Date): Promise<void>;
  delete(tenantId: string, id: string): Promise<void>;
}
