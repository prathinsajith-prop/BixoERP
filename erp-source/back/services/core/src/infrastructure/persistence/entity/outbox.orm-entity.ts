import {
  Entity as TypeOrmEntity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@TypeOrmEntity('outbox_events')
@Index(['published', 'created_at'])
export class OutboxEventOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  tenant_id: string;

  @Column({ length: 100 })
  topic: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column({ type: 'boolean', default: false })
  published: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}

@TypeOrmEntity('processed_events')
export class ProcessedEventOrmEntity {
  @PrimaryColumn('uuid')
  event_id: string;

  @Column({ length: 100 })
  event_type: string;

  @CreateDateColumn({ type: 'timestamptz' })
  processed_at: Date;
}
