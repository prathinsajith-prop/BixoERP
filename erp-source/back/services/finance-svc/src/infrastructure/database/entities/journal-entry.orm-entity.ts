import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { JournalLineOrmEntity } from './journal-line.orm-entity';

@Entity('journal_entries')
@Index(['tenantId', 'entryNumber'], { unique: true })
@Index(['tenantId', 'fiscalYear', 'fiscalMonth'])
export class JournalEntryOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'entry_number', length: 30 })
  entryNumber!: string;

  @Column({ type: 'date' })
  date!: Date;

  @Column({ type: 'text' })
  description!: string;

  @Column({ length: 20 })
  status!: string; // DRAFT, POSTED, REVERSED

  @Column({ name: 'tenant_id', type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ name: 'fiscal_year', type: 'int' })
  fiscalYear!: number;

  @Column({ name: 'fiscal_month', type: 'int' })
  fiscalMonth!: number;

  @Column({ name: 'reversal_of_id', type: 'uuid', nullable: true })
  reversalOfId!: string | null;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: string;

  @Column({ name: 'posted_at', type: 'timestamptz', nullable: true })
  postedAt!: Date | null;

  @Column({ name: 'idempotency_key', type: 'varchar', length: 64, nullable: true })
  @Index({ unique: true })
  idempotencyKey!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => JournalLineOrmEntity, (line) => line.journalEntry, {
    cascade: true,
  })
  lines!: JournalLineOrmEntity[];
}
