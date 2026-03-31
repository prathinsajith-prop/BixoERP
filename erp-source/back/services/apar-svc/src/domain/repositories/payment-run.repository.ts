import { PaymentRun } from '../entities/payment-run.entity';

export interface PaymentRunRepository {
  findById(id: string, tenantId: string): Promise<PaymentRun | null>;
  findByRunNumber(runNumber: string, tenantId: string): Promise<PaymentRun | null>;
  findByStatus(status: string, tenantId: string): Promise<PaymentRun[]>;
  findByDateRange(from: Date, to: Date, tenantId: string): Promise<PaymentRun[]>;
  save(run: PaymentRun): Promise<PaymentRun>;
  update(run: PaymentRun): Promise<PaymentRun>;
  nextRunNumber(tenantId: string): Promise<string>;
  saveWithOutbox(run: PaymentRun): Promise<PaymentRun>;
}

export const PAYMENT_RUN_REPOSITORY = Symbol('PaymentRunRepository');
