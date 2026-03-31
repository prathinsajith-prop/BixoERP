import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SocialAccountRepository } from '../../../domain/repository/social-account.repository';
import { SocialAccount, SocialProvider } from '../../../domain/entity/social-account.entity';
import { SocialAccountOrmEntity } from '../entity/social-account.orm-entity';

@Injectable()
export class PostgresSocialAccountRepository implements SocialAccountRepository {
  constructor(
    @InjectRepository(SocialAccountOrmEntity)
    private readonly repo: Repository<SocialAccountOrmEntity>,
  ) {}

  async findByProviderAndAccountId(
    tenantId: string,
    provider: SocialProvider,
    providerAccountId: string,
  ): Promise<SocialAccount | null> {
    const row = await this.repo.findOne({
      where: { tenant_id: tenantId, provider, provider_account_id: providerAccountId },
    });
    return row ? this.toDomain(row) : null;
  }

  async findByUserId(tenantId: string, userId: string): Promise<SocialAccount[]> {
    const rows = await this.repo.find({
      where: { tenant_id: tenantId, user_id: userId },
      order: { created_at: 'ASC' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async save(account: SocialAccount): Promise<void> {
    await this.repo.insert(this.toOrm(account));
  }

  async delete(tenantId: string, userId: string, provider: SocialProvider): Promise<void> {
    await this.repo.delete({ tenant_id: tenantId, user_id: userId, provider });
  }

  private toDomain(orm: SocialAccountOrmEntity): SocialAccount {
    return SocialAccount.reconstitute({
      id: orm.id,
      tenantId: orm.tenant_id,
      userId: orm.user_id,
      provider: orm.provider as SocialProvider,
      providerAccountId: orm.provider_account_id,
      email: orm.email,
      displayName: orm.display_name,
      avatarUrl: orm.avatar_url,
      createdAt: orm.created_at,
      updatedAt: orm.updated_at,
    });
  }

  private toOrm(account: SocialAccount): Partial<SocialAccountOrmEntity> {
    return {
      id: account.id,
      tenant_id: account.tenantId,
      user_id: account.userId,
      provider: account.provider,
      provider_account_id: account.providerAccountId,
      email: account.email,
      display_name: account.displayName,
      avatar_url: account.avatarUrl,
    };
  }
}
