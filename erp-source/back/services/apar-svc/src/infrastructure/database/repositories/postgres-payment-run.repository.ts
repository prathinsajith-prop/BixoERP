import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, Between } from 'typeorm';
import {
  PaymentRun,
  PaymentRunStatus,
  PaymentRunLineProps,
  PaymentMethod,
} from '../../../domain/entities/payment-run.entity';
import { PaymentRunRepository } from '../../../domain/repositories/payment-run.repository';
import { PaymentRunOrmEntity } from '../entities/payment-run.orm-entity';
import { PaymentRunLineOrmEntity } from '../entities/payment-run-line.orm-entity';
import { OutboxEventOrmEntity } from '../entities/outbox-event.orm-entity';
import { Money } from '../../../domain/value-objects/money';

@Injectable()
export class PostgresPaymentRunRepository implements PaymentRunRepository {
  constructor(
    @InjectRepository(PaymentRunOrmEntity)
    private readonly repo: Repository<PaymentRunOrmEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async findById(id: string, tenantId: string): Promise<PaymentRun | null> {
    const row = await this.repo.findOne({
      where: { id, tenantId },
      relations: ['lines'],
    });
    return row ? this.toDomain(row) : null;
  }

  async findByRunNumber(runNumber: string, tenantId: string): Promise<PaymentRun | null> {
    const row = await this.repo.findOne({
      where: { runNumber, tenantId },
      relations: ['lines'],
    });
    return row ? this.toDomain(row) : null;
  }

  async findByStatus(status: string, tenantId: string): Promise<PaymentRun[]> {
    const rows = await this.repo.find({
      where: { status, tenantId },
      relations: ['lines'],
      order: { createdAt: 'DESC' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findByDateRange(from: Date, to: Date, tenantId: string): Promise<PaymentRun[]> {
    const rows = await this.repo.find({
      where: {
        tenantId,
        paymentDate: Between(from, to),
      },
      relations: ['lines'],
      order: { paymentDate: 'ASC' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async save(run: PaymentRun): Promise<PaymentRun> {
    const entity = this.toOrm(run);
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  async update(run: PaymentRun): Promise<PaymentRun> {
    return this.save(run);
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

  async saveWithOutbox(run: PaymentRun): Promise<PaymentRun> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const entity = this.toOrm(run);
      const savedEntity = await queryRunner.manager.save(PaymentRunOrmEntity, entity);

      const domainEvents = run.domainEvents;
      for (const event of domainEvents) {
        const outbox = new OutboxEventOrmEntity();
        outbox.eventId = event.eventId;
        outbox.eventType = event.eventType;
        outbox.aggregateId = event.aggregateId;
        outbox.tenantId = event.tenantId;
        outbox.payload = event.payload;
        outbox.processed = false;
        await queryRunner.manager.save(OutboxEventOrmEntity, outbox);
      }

      await queryRunner.commitTransaction();
      return this.toDomain(savedEntity);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private toDomain(row: PaymentRunOrmEntity): PaymentRun {
    const currency = row.currency;

    const lines: PaymentRunLineProps[] = (row.lines || []).map((l) => ({
      id: l.id,
      vendorInvoiceId: l.vendorInvoiceId,
      vendorId: l.vendorId,
      amount: Money.create(l.amount, currency),
      discountAmount: Money.create(l.discountAmount, currency),
      netAmount: Money.create(l.netAmount, currency),
      status: l.status as 'PENDING' | 'PAID' | 'FAILED',
      failureReason: l.failureReason,
    }));

    return PaymentRun.fromPersistence(
      {
        runNumber: row.runNumber,
        description: row.description,
        paymentDate: row.paymentDate,
        paymentMethod: row.paymentMethod as PaymentMethod,
        status: row.status as PaymentRunStatus,
        lines,
        totalAmount: Money.create(row.totalAmount, currency),
        totalDiscount: Money.create(row.totalDiscount, currency),
        totalNet: Money.create(row.totalNet, currency),
        currency,
        bankAccountId: row.bankAccountId,
        tenantId: row.tenantId,
        createdBy: row.createdBy,
        approvedBy: row.approvedBy,
        approvedAt: row.approvedAt,
        completedAt: row.completedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }

  private toOrm(run: PaymentRun): PaymentRunOrmEntity {
    const entity = new PaymentRunOrmEntity();
    entity.id = run.id;
    entity.runNumber = run.runNumber;
    entity.description = run.description;
    entity.paymentDate = run.paymentDate;
    entity.paymentMethod = run.paymentMethod;
    entity.status = run.status;
    entity.totalAmount = run.totalAmount.amount;
    entity.totalDiscount = run.totalDiscount.amount;
    entity.totalNet = run.totalNet.amount;
    entity.currency = run.currency;
    entity.bankAccountId = run.bankAccountId;
    entity.tenantId = run.tenantId;
    entity.createdBy = run.createdBy;
    entity.approvedBy = run.approvedBy;
    entity.approvedAt = run.approvedAt;
    entity.completedAt = run.completedAt;
    entity.createdAt = run.createdAt;

    entity.lines = run.lines.map((l) => {
      const line = new PaymentRunLineOrmEntity();
      line.id = l.id;
      line.paymentRunId = run.id;
      line.vendorInvoiceId = l.vendorInvoiceId;
      line.vendorId = l.vendorId;
      line.amount = l.amount.amount;
      line.discountAmount = l.discountAmount.amount;
      line.netAmount = l.netAmount.amount;
      line.status = l.status;
      line.failureReason = l.failureReason;
      line.currency = run.currency;
      return line;
    });

    return entity;
  }
}
