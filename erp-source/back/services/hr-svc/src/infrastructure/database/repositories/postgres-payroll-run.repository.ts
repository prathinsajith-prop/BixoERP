import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PayrollRun, PayrollRunProps, PayrollRunStatus, PayrollLineProps } from '../../../domain/entities/payroll-run.entity';
import { PayrollRunRepository } from '../../../domain/repositories/payroll-run.repository';
import { PayrollRunOrmEntity } from '../entities/payroll-run.orm-entity';
import { PayrollLineOrmEntity } from '../entities/payroll-line.orm-entity';
import { OutboxEventOrmEntity } from '../entities/outbox-event.orm-entity';
import { Money } from '../../../domain/value-objects/money';

@Injectable()
export class PostgresPayrollRunRepository implements PayrollRunRepository {
  constructor(
    @InjectRepository(PayrollRunOrmEntity) private readonly repo: Repository<PayrollRunOrmEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async findById(id: string, tenantId: string): Promise<PayrollRun | null> {
    const row = await this.repo.findOne({ where: { id, tenantId }, relations: ['lines'] });
    return row ? this.toDomain(row) : null;
  }

  async findByRunNumber(runNumber: string, tenantId: string): Promise<PayrollRun | null> {
    const row = await this.repo.findOne({ where: { runNumber, tenantId }, relations: ['lines'] });
    return row ? this.toDomain(row) : null;
  }

  async findByPeriod(periodYear: number, periodMonth: number, tenantId: string): Promise<PayrollRun[]> {
    const rows = await this.repo.find({
      where: { periodYear, periodMonth, tenantId },
      relations: ['lines'],
      order: { createdAt: 'DESC' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findAll(tenantId: string): Promise<PayrollRun[]> {
    const rows = await this.repo.find({
      where: { tenantId },
      relations: ['lines'],
      order: { createdAt: 'DESC' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async save(payrollRun: PayrollRun): Promise<PayrollRun> {
    const entity = this.toOrm(payrollRun);
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  async update(payrollRun: PayrollRun): Promise<PayrollRun> {
    return this.save(payrollRun);
  }

  async nextRunNumber(tenantId: string): Promise<string> {
    const result = await this.repo
      .createQueryBuilder('pr')
      .select('COUNT(*)', 'count')
      .where('pr.tenant_id = :tenantId', { tenantId })
      .getRawOne();
    const seq = parseInt(result.count, 10) + 1;
    return `PR-${String(seq).padStart(6, '0')}`;
  }

  async saveWithOutbox(payrollRun: PayrollRun): Promise<PayrollRun> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const entity = this.toOrm(payrollRun);
      // Save lines separately
      const lines = entity.lines;
      entity.lines = [];
      const savedRun = await queryRunner.manager.save(PayrollRunOrmEntity, entity);

      for (const line of lines) {
        line.payrollRunId = savedRun.id;
        await queryRunner.manager.save(PayrollLineOrmEntity, line);
      }

      const domainEvents = payrollRun.domainEvents;
      for (const event of domainEvents) {
        const outbox = new OutboxEventOrmEntity();
        outbox.eventId = event.eventId;
        outbox.eventType = event.eventType;
        outbox.aggregateId = event.aggregateId;
        outbox.tenantId = event.tenantId;
        outbox.payload = event.payload;
        outbox.processed = false;
        outbox.processedAt = null;
        await queryRunner.manager.save(OutboxEventOrmEntity, outbox);
      }

      await queryRunner.commitTransaction();
      savedRun.lines = lines.map((l) => {
        l.payrollRunId = savedRun.id;
        return l;
      });
      return this.toDomain(savedRun);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private toDomain(row: PayrollRunOrmEntity): PayrollRun {
    const currency = row.currency;
    const lines: PayrollLineProps[] = (row.lines || []).map((l) => ({
      id: l.id,
      employeeId: l.employeeId,
      baseSalary: Money.create(l.baseSalary, currency),
      allowances: Money.create(l.allowances, currency),
      deductions: Money.create(l.deductions, currency),
      taxAmount: Money.create(l.taxAmount, currency),
      netPay: Money.create(l.netPay, currency),
      currency,
    }));

    return PayrollRun.fromPersistence(
      {
        runNumber: row.runNumber,
        periodYear: row.periodYear,
        periodMonth: row.periodMonth,
        status: row.status as PayrollRunStatus,
        lines,
        totalGross: Money.create(row.totalGross, currency),
        totalDeductions: Money.create(row.totalDeductions, currency),
        totalNet: Money.create(row.totalNet, currency),
        currency,
        tenantId: row.tenantId,
        createdBy: row.createdBy,
        processedAt: row.processedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }

  private toOrm(run: PayrollRun): PayrollRunOrmEntity {
    const entity = new PayrollRunOrmEntity();
    entity.id = run.id;
    entity.runNumber = run.runNumber;
    entity.periodYear = run.periodYear;
    entity.periodMonth = run.periodMonth;
    entity.status = run.status;
    entity.totalGross = run.totalGross.amount;
    entity.totalDeductions = run.totalDeductions.amount;
    entity.totalNet = run.totalNet.amount;
    entity.currency = run.currency;
    entity.tenantId = run.tenantId;
    entity.createdBy = run.createdBy;
    entity.processedAt = run.processedAt;
    entity.createdAt = run.createdAt;
    entity.updatedAt = run.updatedAt;
    entity.lines = run.lines.map((l) => {
      const line = new PayrollLineOrmEntity();
      line.id = l.id;
      line.payrollRunId = run.id;
      line.employeeId = l.employeeId;
      line.baseSalary = l.baseSalary.amount;
      line.allowances = l.allowances.amount;
      line.deductions = l.deductions.amount;
      line.taxAmount = l.taxAmount.amount;
      line.netPay = l.netPay.amount;
      line.currency = l.currency;
      return line;
    });
    return entity;
  }
}
