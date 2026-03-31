import {
  Entity as TypeOrmEntity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@TypeOrmEntity('audit_logs')
@Index(['tenant_id', 'created_at'])
export class AuditLogOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  tenant_id: string;

  @Column('uuid')
  @Index()
  user_id: string;

  @Column({ length: 200, default: '' })
  user_name: string;

  @Column({ length: 100 })
  @Index()
  action: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @Column({ length: 100, default: '' })
  entity_type: string;

  @Column({ type: 'varchar', length: 100, default: '' })
  entity_id: string;

  @Column({ type: 'varchar', length: 50, default: '' })
  ip_address: string;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  @Index()
  created_at: Date;
}
