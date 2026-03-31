import { JournalEntry } from '../entities/journal-entry.entity';

export interface JournalEntryRepository {
  findById(id: string, tenantId: string): Promise<JournalEntry | null>;
  findByEntryNumber(entryNumber: string, tenantId: string): Promise<JournalEntry | null>;
  findByPeriod(
    fiscalYear: number,
    fiscalMonth: number,
    tenantId: string,
  ): Promise<JournalEntry[]>;
  findDraftsByPeriod(
    fiscalYear: number,
    fiscalMonth: number,
    tenantId: string,
  ): Promise<JournalEntry[]>;
  save(entry: JournalEntry): Promise<JournalEntry>;
  update(entry: JournalEntry): Promise<JournalEntry>;
  nextEntryNumber(tenantId: string): Promise<string>;
  existsByIdempotencyKey(key: string, tenantId: string): Promise<boolean>;
  saveWithOutbox(entry: JournalEntry): Promise<JournalEntry>;
}

export const JOURNAL_ENTRY_REPOSITORY = Symbol('JournalEntryRepository');
