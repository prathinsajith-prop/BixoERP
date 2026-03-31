import { Inject, Injectable } from '@nestjs/common';
import {
  JournalEntryRepository,
  JOURNAL_ENTRY_REPOSITORY,
} from '../../domain/repositories/journal-entry.repository';
import { EventPublisher, EVENT_PUBLISHER } from '../ports/event-publisher.port';
import { CachePort, CACHE_PORT } from '../ports/cache.port';
import {
  EntityNotFoundException,
  BusinessRuleViolation,
} from '../../domain/exceptions/domain.exceptions';

export interface PostJournalEntryInput {
  entryId: string;
  tenantId: string;
}

@Injectable()
export class PostJournalEntryUseCase {
  constructor(
    @Inject(JOURNAL_ENTRY_REPOSITORY)
    private readonly journalEntryRepo: JournalEntryRepository,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisher,
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
  ) {}

  async execute(input: PostJournalEntryInput): Promise<void> {
    const entry = await this.journalEntryRepo.findById(input.entryId, input.tenantId);
    if (!entry) {
      throw new EntityNotFoundException('JournalEntry', input.entryId);
    }

    // Domain performs status check + double-entry re-validation
    entry.post();

    // Persist with outbox
    await this.journalEntryRepo.saveWithOutbox(entry);

    // Invalidate cache
    await this.cache.delByPattern(`journal:${input.tenantId}:*`);

    // Publish domain events
    const events = entry.clearDomainEvents();
    if (events.length > 0) {
      await this.eventPublisher.publishMany(events);
    }
  }
}
