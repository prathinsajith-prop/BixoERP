import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { AuditLogOrmEntity } from '../persistence/entity/audit-log.orm-entity';

export interface AuditEntry {
  tenantId: string;
  userId: string;
  userName: string;
  action: string;
  description: string;
  entityType?: string;
  entityId?: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLogOrmEntity)
    private readonly repo: Repository<AuditLogOrmEntity>,
  ) {}

  async record(entry: AuditEntry): Promise<void> {
    const entity = this.repo.create({
      id: randomUUID(),
      tenant_id: entry.tenantId,
      user_id: entry.userId,
      user_name: entry.userName,
      action: entry.action,
      description: entry.description,
      entity_type: entry.entityType ?? '',
      entity_id: entry.entityId ?? '',
      ip_address: entry.ipAddress ?? '',
      metadata: entry.metadata ?? {},
    });
    await this.repo.save(entity);
  }

  async findByTenant(
    tenantId: string,
    opts: { page?: number; limit?: number } = {},
  ): Promise<{ entries: AuditLogOrmEntity[]; total: number }> {
    const page = opts.page ?? 1;
    const limit = Math.min(opts.limit ?? 50, 200);

    const [entries, total] = await this.repo.findAndCount({
      where: { tenant_id: tenantId },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { entries, total };
  }
}
