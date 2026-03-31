import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { JournalEntryOrmEntity } from './journal-entry.orm-entity';

@Entity('journal_lines')
export class JournalLineOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'journal_entry_id', type: 'uuid' })
  journalEntryId!: string;

  @Column({ name: 'account_id', type: 'uuid' })
  accountId!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'numeric', precision: 19, scale: 4, default: 0 })
  debit!: string;

  @Column({ type: 'numeric', precision: 19, scale: 4, default: 0 })
  credit!: string;

  @Column({ length: 3 })
  currency!: string;

  @Column({ name: 'exchange_rate', type: 'numeric', precision: 12, scale: 6, default: 1 })
  exchangeRate!: string;

  @Column({ name: 'base_currency_debit', type: 'numeric', precision: 19, scale: 4, default: 0 })
  baseCurrencyDebit!: string;

  @Column({ name: 'base_currency_credit', type: 'numeric', precision: 19, scale: 4, default: 0 })
  baseCurrencyCredit!: string;

  @ManyToOne(() => JournalEntryOrmEntity, (entry) => entry.lines, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'journal_entry_id' })
  journalEntry!: JournalEntryOrmEntity;
}
