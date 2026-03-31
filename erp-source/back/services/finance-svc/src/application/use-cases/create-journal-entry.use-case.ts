import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { JournalEntry, JournalLineProps } from '../../domain/entities/journal-entry.entity';
import { Money } from '../../domain/value-objects/money';
import { DoubleEntryValidator } from '../../domain/services/double-entry-validator';
import {
  JournalEntryRepository,
  JOURNAL_ENTRY_REPOSITORY,
} from '../../domain/repositories/journal-entry.repository';
import { EventPublisher, EVENT_PUBLISHER } from '../ports/event-publisher.port';
import { CachePort, CACHE_PORT } from '../ports/cache.port';
import {
  BusinessRuleViolation,
  DuplicateEntryException,
} from '../../domain/exceptions/domain.exceptions';

export interface CreateJournalEntryInput {
  date: Date;
  description: string;
  lines: {
    accountId: string;
    description: string;
    debitAmount: number;
    creditAmount: number;
    currency: string;
    exchangeRate: number;
  }[];
  fiscalYear: number;
  fiscalMonth: number;
  tenantId: string;
  createdBy: string;
  idempotencyKey?: string;
}

export interface CreateJournalEntryOutput {
  id: string;
  entryNumber: string;
  status: string;
}

@Injectable()
export class CreateJournalEntryUseCase {
  constructor(
    @Inject(JOURNAL_ENTRY_REPOSITORY)
    private readonly journalEntryRepo: JournalEntryRepository,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisher,
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
  ) {}

  async execute(input: CreateJournalEntryInput): Promise<CreateJournalEntryOutput> {
    // Idempotency check
    if (input.idempotencyKey) {
      const exists = await this.journalEntryRepo.existsByIdempotencyKey(
        input.idempotencyKey,
        input.tenantId,
      );
      if (exists) {
        throw new DuplicateEntryException('idempotencyKey', input.idempotencyKey);
      }
    }

    // Build journal lines with Money value objects
    const baseCurrency = 'USD'; // TODO: from tenant config
    const lines: JournalLineProps[] = input.lines.map((l) => ({
      id: uuidv4(),
      accountId: l.accountId,
      description: l.description,
      debit: Money.create(l.debitAmount, l.currency),
      credit: Money.create(l.creditAmount, l.currency),
      currency: l.currency,
      exchangeRate: l.exchangeRate,
      baseCurrencyDebit: Money.create(l.debitAmount * l.exchangeRate, baseCurrency),
      baseCurrencyCredit: Money.create(l.creditAmount * l.exchangeRate, baseCurrency),
    }));

    // Domain validation
    const validation = DoubleEntryValidator.validate(lines);
    if (!validation.valid) {
      throw new BusinessRuleViolation(validation.error!);
    }

    // Generate entry number
    const entryNumber = await this.journalEntryRepo.nextEntryNumber(input.tenantId);

    // Create aggregate
    const entry = JournalEntry.create({
      entryNumber,
      date: input.date,
      description: input.description,
      lines,
      tenantId: input.tenantId,
      fiscalYear: input.fiscalYear,
      fiscalMonth: input.fiscalMonth,
      createdBy: input.createdBy,
    });

    // Save with outbox (same transaction)
    const saved = await this.journalEntryRepo.saveWithOutbox(entry);

    // Invalidate cache
    await this.cache.delByPattern(`journal:${input.tenantId}:*`);

    // Publish domain events
    const events = saved.clearDomainEvents();
    if (events.length > 0) {
      await this.eventPublisher.publishMany(events);
    }

    return {
      id: saved.id,
      entryNumber: saved.entryNumber,
      status: saved.status,
    };
  }
}
