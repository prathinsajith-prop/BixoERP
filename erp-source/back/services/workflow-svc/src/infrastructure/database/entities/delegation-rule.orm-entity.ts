import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('delegation_rules')
@Index(['tenantId', 'fromUserId'])
@Index(['tenantId', 'toUserId'])
export class DelegationRuleOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'from_user_id', type: 'uuid' })
  fromUserId!: string;

  @Column({ name: 'to_user_id', type: 'uuid' })
  toUserId!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ name: 'entity_type', type: 'varchar', length: 50, nullable: true })
  entityType!: string | null;

  @Column({ name: 'start_date', type: 'timestamptz' })
  startDate!: Date;

  @Column({ name: 'end_date', type: 'timestamptz' })
  endDate!: Date;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
