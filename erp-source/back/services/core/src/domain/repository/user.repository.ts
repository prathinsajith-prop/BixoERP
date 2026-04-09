import { User } from '../entity/user.entity';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

/** Server-side filter options forwarded from the API query string. */
export interface UserFilters {
  /** Full-text search across email, first_name, last_name. */
  search?: string;
  /**
   * Structured filter string in the format "field:OP(value[,value…]);…"
   * Supported fields: status, role, name, email, created_at
   */
  filter?: string;
  /** Column key as sent by the client (e.g. "first_name", "email", "status", "created_at"). */
  sortBy?: string;
  /** Sort direction — defaults to DESC when omitted. */
  sortDir?: 'ASC' | 'DESC';
}

export interface UserSummary {
  total: number;
  active: number;
  inactive: number;
}

export interface UserRepository {
  findById(tenantId: string, id: string): Promise<User | null>;
  findByIdGlobal(id: string): Promise<User | null>;
  findByEmail(tenantId: string, email: string): Promise<User | null>;
  findByEmailGlobal(email: string): Promise<User | null>;
  findByTenant(
    tenantId: string,
    page: number,
    limit: number,
    filters?: UserFilters,
  ): Promise<{ users: User[]; total: number; summary: UserSummary }>;
  save(user: User): Promise<void>;
  update(user: User): Promise<void>;
  /** Update only last_login_at and reset failed_login_attempts WITHOUT touching updated_at. */
  updateLastLogin(userId: string, lastLoginAt: Date): Promise<void>;
  delete(tenantId: string, id: string): Promise<void>;
}
