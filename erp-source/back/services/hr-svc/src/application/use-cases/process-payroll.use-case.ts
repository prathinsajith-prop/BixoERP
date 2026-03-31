import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PayrollRun } from '../../domain/entities/payroll-run.entity';
import { PayrollCalculationService } from '../../domain/services/payroll-calculation.service';
import {
  EmployeeRepository,
  EMPLOYEE_REPOSITORY,
} from '../../domain/repositories/employee.repository';
import {
  PayrollRunRepository,
  PAYROLL_RUN_REPOSITORY,
} from '../../domain/repositories/payroll-run.repository';
import { EventPublisher, EVENT_PUBLISHER } from '../ports/event-publisher.port';
import { CachePort, CACHE_PORT } from '../ports/cache.port';
import { BusinessRuleViolation } from '../../domain/exceptions/domain.exceptions';
import { EmploymentStatus } from '../../domain/value-objects/employment-status';

export interface ProcessPayrollInput {
  periodYear: number;
  periodMonth: number;
  allowancesMap: Record<string, number>;
  deductionsMap: Record<string, number>;
  taxRate: number;
  currency: string;
  tenantId: string;
  createdBy: string;
}

export interface ProcessPayrollOutput {
  id: string;
  runNumber: string;
  status: string;
  totalGross: string;
  totalNet: string;
  employeeCount: number;
}

@Injectable()
export class ProcessPayrollUseCase {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private readonly employeeRepo: EmployeeRepository,
    @Inject(PAYROLL_RUN_REPOSITORY)
    private readonly payrollRunRepo: PayrollRunRepository,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisher,
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
  ) {}

  async execute(input: ProcessPayrollInput): Promise<ProcessPayrollOutput> {
    // Get active employees
    const allEmployees = await this.employeeRepo.findActive(input.tenantId);
    const activeEmployees = allEmployees.filter(
      (e) => e.status === EmploymentStatus.ACTIVE,
    );

    if (activeEmployees.length === 0) {
      throw new BusinessRuleViolation('No active employees found for payroll processing');
    }

    // Calculate payroll using domain service
    const lines = PayrollCalculationService.calculateBatch(
      activeEmployees,
      new Map(Object.entries(input.allowancesMap)),
      new Map(Object.entries(input.deductionsMap)),
      input.taxRate,
    );

    // Validate all lines
    const validation = PayrollCalculationService.validatePayrollLines(lines);
    if (!validation.valid) {
      throw new BusinessRuleViolation(validation.error!);
    }

    // Generate run number
    const runNumber = await this.payrollRunRepo.nextRunNumber(input.tenantId);

    // Create aggregate (validates period is not in the future)
    const payrollRun = PayrollRun.create({
      runNumber,
      periodYear: input.periodYear,
      periodMonth: input.periodMonth,
      lines,
      currency: input.currency,
      tenantId: input.tenantId,
      createdBy: input.createdBy,
    });

    // Process (marks as completed, emits payroll.processed event)
    payrollRun.process();

    // Save with outbox (same transaction)
    const saved = await this.payrollRunRepo.saveWithOutbox(payrollRun);

    // Invalidate cache
    await this.cache.delByPattern(`payroll:${input.tenantId}:*`);

    // Publish domain events (payroll.processed → finance-svc, apar-svc, notification-svc)
    const events = saved.clearDomainEvents();
    if (events.length > 0) {
      await this.eventPublisher.publishMany(events);
    }

    return {
      id: saved.id,
      runNumber: saved.runNumber,
      status: saved.status,
      totalGross: saved.totalGross.amount,
      totalNet: saved.totalNet.amount,
      employeeCount: saved.lines.length,
    };
  }
}
