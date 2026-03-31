import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TwoFactorOrmEntity } from '../entity/two-factor.orm-entity';

@Injectable()
export class PostgresTwoFactorRepository {
  constructor(
    @InjectRepository(TwoFactorOrmEntity)
    private readonly repo: Repository<TwoFactorOrmEntity>,
  ) {}

  async findByUserId(tenantId: string, userId: string): Promise<TwoFactorOrmEntity | null> {
    return this.repo.findOne({ where: { tenant_id: tenantId, user_id: userId } });
  }

  async save(entity: TwoFactorOrmEntity): Promise<void> {
    await this.repo.save(entity);
  }

  async upsert(entity: Partial<TwoFactorOrmEntity> & { user_id: string; tenant_id: string }): Promise<void> {
    const existing = await this.repo.findOne({
      where: { tenant_id: entity.tenant_id, user_id: entity.user_id },
    });
    if (existing) {
      await this.repo.update({ id: existing.id }, entity);
    } else {
      await this.repo.insert(entity);
    }
  }

  async deleteByUserId(tenantId: string, userId: string): Promise<void> {
    await this.repo.delete({ tenant_id: tenantId, user_id: userId });
  }
}
