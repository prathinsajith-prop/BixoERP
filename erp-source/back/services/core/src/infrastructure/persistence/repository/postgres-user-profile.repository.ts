import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { UserProfileOrmEntity } from '../entity/user-profile.orm-entity';
import { DEFAULT_PROFILE, type UserProfile } from '../../../domain/entity/user-profile';

@Injectable()
export class PostgresUserProfileRepository {
  constructor(
    @InjectRepository(UserProfileOrmEntity)
    private readonly repo: Repository<UserProfileOrmEntity>,
  ) {}

  async findByUserId(tenantId: string, userId: string): Promise<UserProfile> {
    const row = await this.repo.findOne({ where: { tenant_id: tenantId, user_id: userId } });
    if (!row) return { ...JSON.parse(JSON.stringify(DEFAULT_PROFILE)) };
    return this.merge(row.profile);
  }

  async upsert(tenantId: string, userId: string, partial: Record<string, unknown>): Promise<UserProfile> {
    let row = await this.repo.findOne({ where: { tenant_id: tenantId, user_id: userId } });
    if (!row) {
      row = this.repo.create({
        id: randomUUID(),
        tenant_id: tenantId,
        user_id: userId,
        profile: {},
      });
    }
    row.profile = this.deepMerge(row.profile, partial);
    await this.repo.save(row);
    return this.merge(row.profile);
  }

  async deleteByUserId(tenantId: string, userId: string): Promise<void> {
    await this.repo.delete({ tenant_id: tenantId, user_id: userId });
  }

  private merge(stored: Record<string, unknown>): UserProfile {
    const base = JSON.parse(JSON.stringify(DEFAULT_PROFILE)) as Record<string, unknown>;
    return this.deepMerge(base, stored) as unknown as UserProfile;
  }

  private deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
    const output = { ...target };
    for (const key of Object.keys(source)) {
      const sourceVal = source[key];
      const targetVal = target[key];
      if (
        sourceVal &&
        typeof sourceVal === 'object' &&
        !Array.isArray(sourceVal) &&
        targetVal &&
        typeof targetVal === 'object' &&
        !Array.isArray(targetVal)
      ) {
        output[key] = this.deepMerge(
          targetVal as Record<string, unknown>,
          sourceVal as Record<string, unknown>,
        );
      } else {
        output[key] = sourceVal;
      }
    }
    return output;
  }
}
