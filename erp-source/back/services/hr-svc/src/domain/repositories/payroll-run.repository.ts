import { PayrollRun } from '../entities/payroll-run.entity';

export interface PayrollRunRepository {
  findById(id: string, tenantId: string): Promise<PayrollRun | null>;
  findByRunNumber(runNumber: string, tenantId: string): Promise<PayrollRun | null>;
  findByPeriod(periodYear: number, periodMonth: number, tenantId: string): Promise<PayrollRun[]>;
  findAll(tenantId: string): Promise<PayrollRun[]>;
  save(payrollRun: PayrollRun): Promise<PayrollRun>;
  update(payrollRun: PayrollRun): Promise<PayrollRun>;
  nextRunNumber(tenantId: string): Promise<string>;
  saveWithOutbox(payrollRun: PayrollRun): Promise<PayrollRun>;
}

export const PAYROLL_RUN_REPOSITORY = Symbol('PayrollRunRepository');
