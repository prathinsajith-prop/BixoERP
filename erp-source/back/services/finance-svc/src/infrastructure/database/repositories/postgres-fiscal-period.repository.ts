import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FiscalPeriod, FiscalPeriodProps, FiscalPeriodStatus } from '../../../domain/entities/fiscal-period.entity';
import { FiscalPeriodRepository } from '../../../domain/repositories/fiscal-period.repository';
import { FiscalPeriodOrmEntity } from '../entities/fiscal-period.orm-entity';

@Injectable()
export class PostgresFiscalPeriodRepository implements FiscalPeriodRepository {
    constructor(
        @InjectRepository(FiscalPeriodOrmEntity)
        private readonly repo: Repository<FiscalPeriodOrmEntity>,
    ) { }

    async findAll(tenantId: string): Promise<FiscalPeriod[]> {
        const rows = await this.repo.find({
            where: { tenantId },
            order: { startDate: 'DESC' },
        });
        return rows.map((r) => this.toDomain(r));
    }

    async findById(id: string, tenantId: string): Promise<FiscalPeriod | null> {
        const row = await this.repo.findOne({ where: { id, tenantId } });
        return row ? this.toDomain(row) : null;
    }

    async save(period: FiscalPeriod): Promise<FiscalPeriod> {
        const entity = this.toOrm(period);
        const saved = await this.repo.save(entity);
        return this.toDomain(saved);
    }

    async update(period: FiscalPeriod): Promise<FiscalPeriod> {
        const entity = this.toOrm(period);
        const saved = await this.repo.save(entity);
        return this.toDomain(saved);
    }

    private toDomain(row: FiscalPeriodOrmEntity): FiscalPeriod {
        return FiscalPeriod.fromPersistence(
            {
                name: row.name,
                startDate: row.startDate,
                endDate: row.endDate,
                status: row.status as FiscalPeriodStatus,
                tenantId: row.tenantId,
                createdAt: row.createdAt,
                updatedAt: row.updatedAt,
            } as FiscalPeriodProps,
            row.id,
        );
    }

    private toOrm(period: FiscalPeriod): FiscalPeriodOrmEntity {
        const entity = new FiscalPeriodOrmEntity();
        entity.id = period.id;
        entity.name = period.name;
        entity.startDate = period.startDate;
        entity.endDate = period.endDate;
        entity.status = period.status;
        entity.tenantId = period.tenantId;
        return entity;
    }
}
