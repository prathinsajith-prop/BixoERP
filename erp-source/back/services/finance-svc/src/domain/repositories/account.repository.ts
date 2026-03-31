import { Account } from '../entities/account.entity';

export interface AccountRepository {
  findById(id: string, tenantId: string): Promise<Account | null>;
  findByCode(code: string, tenantId: string): Promise<Account | null>;
  findAll(tenantId: string): Promise<Account[]>;
  findByType(type: string, tenantId: string): Promise<Account[]>;
  findByParentId(parentId: string, tenantId: string): Promise<Account[]>;
  save(account: Account): Promise<Account>;
  update(account: Account): Promise<Account>;
  delete(id: string, tenantId: string): Promise<void>;
  existsByCode(code: string, tenantId: string): Promise<boolean>;
}

export const ACCOUNT_REPOSITORY = Symbol('AccountRepository');
