import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

/** Processed events table — for idempotent consumers */
@Entity('processed_events')
@Index(['tenantId', 'eventId'], { unique: true })
export class ProcessedEventOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'event_id', type: 'uuid' })
  eventId!: string;

  @Column({ name: 'event_type', length: 100 })
  eventType!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @CreateDateColumn({ name: 'processed_at' })
  processedAt!: Date;
}
