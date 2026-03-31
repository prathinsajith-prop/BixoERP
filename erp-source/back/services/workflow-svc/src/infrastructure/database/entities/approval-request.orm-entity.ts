import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { ApprovalStepOrmEntity } from './approval-step.orm-entity';

@Entity('approval_requests')
@Index(['tenantId', 'entityType', 'entityId'])
@Index(['tenantId', 'requestedBy'])
@Index(['tenantId', 'status'])
export class ApprovalRequestOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'workflow_definition_id', type: 'uuid' })
  workflowDefinitionId!: string;

  @Column({ name: 'entity_type', length: 50 })
  entityType!: string;

  @Column({ name: 'entity_id', type: 'uuid' })
  entityId!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ name: 'requested_by', type: 'uuid' })
  requestedBy!: string;

  @Column({ length: 20 })
  status!: string;

  @Column({ name: 'current_step_order', type: 'int' })
  currentStepOrder!: number;

  @Column({ name: 'total_steps', type: 'int' })
  totalSteps!: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => ApprovalStepOrmEntity, (step) => step.request, {
    cascade: true,
    eager: true,
  })
  steps!: ApprovalStepOrmEntity[];
}
