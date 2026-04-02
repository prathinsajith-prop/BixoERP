import { FiscalPeriod } from '../entities/fiscal-period.entity';

export interface FiscalPeriodRepository {
    findAll(tenantId: string): Promise<FiscalPeriod[]>;
    findById(id: string, tenantId: string): Promise<FiscalPeriod | null>;
    save(period: FiscalPeriod): Promise<FiscalPeriod>;
    update(period: FiscalPeriod): Promise<FiscalPeriod>;
}

export const FISCAL_PERIOD_REPOSITORY = Symbol('FiscalPeriodRepository');
