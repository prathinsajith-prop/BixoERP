import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { LoginHistoryOrmEntity } from '../entity/login-history.orm-entity';

export interface LoginHistoryEntry {
    id: string;
    tenantId: string;
    userId: string;
    ipAddress: string | null;
    userAgent: string | null;
    status: string;
    failureReason: string | null;
    createdAt: Date;
}

@Injectable()
export class PostgresLoginHistoryRepository {
    constructor(
        @InjectRepository(LoginHistoryOrmEntity)
        private readonly repo: Repository<LoginHistoryOrmEntity>,
    ) { }

    async record(entry: {
        tenantId: string;
        userId: string;
        ipAddress?: string | null;
        userAgent?: string | null;
        status: 'SUCCESS' | 'FAILURE';
        failureReason?: string | null;
    }): Promise<void> {
        await this.repo.insert({
            id: randomUUID(),
            tenant_id: entry.tenantId,
            user_id: entry.userId,
            ip_address: entry.ipAddress ?? null,
            user_agent: entry.userAgent ?? null,
            status: entry.status,
            failure_reason: entry.failureReason ?? null,
        });
    }

    async findByUserId(
        tenantId: string,
        userId: string,
        limit = 20,
    ): Promise<{ entries: LoginHistoryEntry[]; total: number }> {
        const [rows, total] = await this.repo.findAndCount({
            where: { tenant_id: tenantId, user_id: userId },
            order: { created_at: 'DESC' },
            take: limit,
        });
        return {
            entries: rows.map((r) => ({
                id: r.id,
                tenantId: r.tenant_id,
                userId: r.user_id,
                ipAddress: r.ip_address,
                userAgent: r.user_agent,
                status: r.status,
                failureReason: r.failure_reason,
                createdAt: r.created_at,
            })),
            total,
        };
    }
}
