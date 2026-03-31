import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { UserSettingsOrmEntity } from '../entity/user-settings.orm-entity';
import { DEFAULT_SETTINGS, type UserSettings } from '../../../domain/entity/user-settings';

@Injectable()
export class PostgresUserSettingsRepository {
  constructor(
    @InjectRepository(UserSettingsOrmEntity)
    private readonly repo: Repository<UserSettingsOrmEntity>,
  ) {}

  async findByUserId(tenantId: string, userId: string): Promise<UserSettings> {
    const row = await this.repo.findOne({ where: { tenant_id: tenantId, user_id: userId } });
    if (!row) return { ...DEFAULT_SETTINGS };
    return this.merge(row.settings);
  }

  async upsert(tenantId: string, userId: string, partial: Record<string, unknown>): Promise<UserSettings> {
    let row = await this.repo.findOne({ where: { tenant_id: tenantId, user_id: userId } });
    if (!row) {
      row = this.repo.create({
        id: randomUUID(),
        tenant_id: tenantId,
        user_id: userId,
        settings: {},
      });
    }
    row.settings = this.deepMerge(row.settings, partial);
    await this.repo.save(row);
    return this.merge(row.settings);
  }

  async deleteByUserId(tenantId: string, userId: string): Promise<void> {
    await this.repo.delete({ tenant_id: tenantId, user_id: userId });
  }

  private merge(stored: Record<string, unknown>): UserSettings {
    const base = JSON.parse(JSON.stringify(DEFAULT_SETTINGS)) as Record<string, unknown>;
    return this.deepMerge(base, stored) as unknown as UserSettings;
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
