import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account, AccountType, NormalBalance } from '../../../domain/entities/account.entity';
import { AccountRepository } from '../../../domain/repositories/account.repository';
import { AccountOrmEntity } from '../entities/account.orm-entity';

@Injectable()
export class PostgresAccountRepository implements AccountRepository {
  constructor(
    @InjectRepository(AccountOrmEntity)
    private readonly repo: Repository<AccountOrmEntity>,
  ) {}

  async findById(id: string, tenantId: string): Promise<Account | null> {
    const row = await this.repo.findOne({ where: { id, tenantId } });
    return row ? this.toDomain(row) : null;
  }

  async findByCode(code: string, tenantId: string): Promise<Account | null> {
    const row = await this.repo.findOne({ where: { code, tenantId } });
    return row ? this.toDomain(row) : null;
  }

  async findAll(tenantId: string): Promise<Account[]> {
    const rows = await this.repo.find({ where: { tenantId }, order: { code: 'ASC' } });
    return rows.map((r) => this.toDomain(r));
  }

  async findByType(type: string, tenantId: string): Promise<Account[]> {
    const rows = await this.repo.find({ where: { type, tenantId }, order: { code: 'ASC' } });
    return rows.map((r) => this.toDomain(r));
  }

  async findByParentId(parentId: string, tenantId: string): Promise<Account[]> {
    const rows = await this.repo.find({ where: { parentId, tenantId }, order: { code: 'ASC' } });
    return rows.map((r) => this.toDomain(r));
  }

  async save(account: Account): Promise<Account> {
    const entity = this.toOrm(account);
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  async update(account: Account): Promise<Account> {
    const entity = this.toOrm(account);
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.repo.delete({ id, tenantId });
  }

  async existsByCode(code: string, tenantId: string): Promise<boolean> {
    const count = await this.repo.count({ where: { code, tenantId } });
    return count > 0;
  }

  private toDomain(row: AccountOrmEntity): Account {
    return Account.fromPersistence(
      {
        code: row.code,
        name: row.name,
        type: row.type as AccountType,
        normalBalance: row.normalBalance as NormalBalance,
        parentId: row.parentId,
        groupId: row.groupId,
        isActive: row.isActive,
        tenantId: row.tenantId,
        description: row.description,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }

  private toOrm(account: Account): AccountOrmEntity {
    const entity = new AccountOrmEntity();
    entity.id = account.id;
    entity.code = account.code;
    entity.name = account.name;
    entity.type = account.type;
    entity.normalBalance = account.normalBalance;
    entity.parentId = account.parentId;
    entity.groupId = account.groupId;
    entity.isActive = account.isActive;
    entity.tenantId = account.tenantId;
    entity.description = account.description;
    entity.createdAt = account.createdAt;
    entity.updatedAt = account.updatedAt;
    return entity;
  }
}
