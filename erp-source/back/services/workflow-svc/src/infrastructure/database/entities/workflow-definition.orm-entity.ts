import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('workflow_definitions')
@Index(['tenantId', 'code'], { unique: true })
@Index(['tenantId', 'entityType'])
export class WorkflowDefinitionOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ length: 50 })
  code!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'entity_type', length: 50 })
  entityType!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ type: 'jsonb' })
  steps!: Record<string, unknown>[];

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ default: 1 })
  version!: number;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
