import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  JournalEntry,
  JournalEntryStatus,
  JournalLineProps,
} from '../../../domain/entities/journal-entry.entity';
import { JournalEntryRepository } from '../../../domain/repositories/journal-entry.repository';
import { JournalEntryOrmEntity } from '../entities/journal-entry.orm-entity';
import { JournalLineOrmEntity } from '../entities/journal-line.orm-entity';
import { OutboxEventOrmEntity } from '../entities/outbox-event.orm-entity';
import { Money } from '../../../domain/value-objects/money';

@Injectable()
export class PostgresJournalEntryRepository implements JournalEntryRepository {
  constructor(
    @InjectRepository(JournalEntryOrmEntity)
    private readonly repo: Repository<JournalEntryOrmEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async findById(id: string, tenantId: string): Promise<JournalEntry | null> {
    const row = await this.repo.findOne({
      where: { id, tenantId },
      relations: ['lines'],
    });
    return row ? this.toDomain(row) : null;
  }

  async findByEntryNumber(entryNumber: string, tenantId: string): Promise<JournalEntry | null> {
    const row = await this.repo.findOne({
      where: { entryNumber, tenantId },
      relations: ['lines'],
    });
    return row ? this.toDomain(row) : null;
  }

  async findByPeriod(
    fiscalYear: number,
    fiscalMonth: number,
    tenantId: string,
  ): Promise<JournalEntry[]> {
    const rows = await this.repo.find({
      where: { fiscalYear, fiscalMonth, tenantId },
      relations: ['lines'],
      order: { createdAt: 'DESC' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findDraftsByPeriod(
    fiscalYear: number,
    fiscalMonth: number,
    tenantId: string,
  ): Promise<JournalEntry[]> {
    const rows = await this.repo.find({
      where: { fiscalYear, fiscalMonth, tenantId, status: 'DRAFT' },
      relations: ['lines'],
    });
    return rows.map((r) => this.toDomain(r));
  }

  async save(entry: JournalEntry): Promise<JournalEntry> {
    const entity = this.toOrm(entry);
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  async update(entry: JournalEntry): Promise<JournalEntry> {
    return this.save(entry);
  }

  async nextEntryNumber(tenantId: string): Promise<string> {
    const result = await this.repo
      .createQueryBuilder('je')
      .select('COUNT(*)', 'count')
      .where('je.tenant_id = :tenantId', { tenantId })
      .getRawOne();
    const seq = parseInt(result.count, 10) + 1;
    return `JE-${String(seq).padStart(6, '0')}`;
  }

  async existsByIdempotencyKey(key: string, tenantId: string): Promise<boolean> {
    const count = await this.repo.count({
      where: { idempotencyKey: key, tenantId },
    });
    return count > 0;
  }

  /** Save journal entry + outbox event in the SAME transaction (Outbox Pattern) */
  async saveWithOutbox(entry: JournalEntry): Promise<JournalEntry> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const entity = this.toOrm(entry);
      const savedEntry = await queryRunner.manager.save(JournalEntryOrmEntity, entity);

      // Write domain events to outbox in the same transaction
      const domainEvents = entry.domainEvents;
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
      return this.toDomain(savedEntry);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private toDomain(row: JournalEntryOrmEntity): JournalEntry {
    const baseCurrency = 'USD';
    const lines: JournalLineProps[] = (row.lines || []).map((l) => ({
      id: l.id,
      accountId: l.accountId,
      description: l.description,
      debit: Money.create(l.debit, l.currency),
      credit: Money.create(l.credit, l.currency),
      currency: l.currency,
      exchangeRate: parseFloat(l.exchangeRate),
      baseCurrencyDebit: Money.create(l.baseCurrencyDebit, baseCurrency),
      baseCurrencyCredit: Money.create(l.baseCurrencyCredit, baseCurrency),
    }));

    return JournalEntry.fromPersistence(
      {
        entryNumber: row.entryNumber,
        date: row.date,
        description: row.description,
        status: row.status as JournalEntryStatus,
        lines,
        tenantId: row.tenantId,
        fiscalYear: row.fiscalYear,
        fiscalMonth: row.fiscalMonth,
        reversalOfId: row.reversalOfId,
        createdBy: row.createdBy,
        postedAt: row.postedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }

  private toOrm(entry: JournalEntry): JournalEntryOrmEntity {
    const entity = new JournalEntryOrmEntity();
    entity.id = entry.id;
    entity.entryNumber = entry.entryNumber;
    entity.date = entry.date;
    entity.description = entry.description;
    entity.status = entry.status;
    entity.tenantId = entry.tenantId;
    entity.fiscalYear = entry.fiscalYear;
    entity.fiscalMonth = entry.fiscalMonth;
    entity.reversalOfId = entry.reversalOfId;
    entity.createdBy = entry.createdBy;
    entity.postedAt = entry.postedAt;
    entity.createdAt = entry.createdAt;

    entity.lines = entry.lines.map((l) => {
      const line = new JournalLineOrmEntity();
      line.id = l.id;
      line.journalEntryId = entry.id;
      line.accountId = l.accountId;
      line.description = l.description;
      line.debit = l.debit.amount;
      line.credit = l.credit.amount;
      line.currency = l.currency;
      line.exchangeRate = String(l.exchangeRate);
      line.baseCurrencyDebit = l.baseCurrencyDebit.amount;
      line.baseCurrencyCredit = l.baseCurrencyCredit.amount;
      return line;
    });

    return entity;
  }
}
