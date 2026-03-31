import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApprovalRequestOrmEntity } from './approval-request.orm-entity';

@Entity('approval_steps')
@Index(['requestId', 'stepOrder'])
export class ApprovalStepOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'request_id', type: 'uuid' })
  requestId!: string;

  @Column({ name: 'step_order', type: 'int' })
  stepOrder!: number;

  @Column({ name: 'step_name', length: 100 })
  stepName!: string;

  @Column({ name: 'approver_user_ids', type: 'jsonb' })
  approverUserIds!: string[];

  @Column({ name: 'approver_role_ids', type: 'jsonb' })
  approverRoleIds!: string[];

  @Column({ length: 20 })
  status!: string;

  @Column({ name: 'decided_by', type: 'uuid', nullable: true })
  decidedBy!: string | null;

  @Column({ name: 'decided_at', type: 'timestamptz', nullable: true })
  decidedAt!: Date | null;

  @Column({ type: 'text', nullable: true })
  comment!: string | null;

  @Column({ name: 'delegated_from', type: 'uuid', nullable: true })
  delegatedFrom!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => ApprovalRequestOrmEntity, (request) => request.steps, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'request_id' })
  request!: ApprovalRequestOrmEntity;
}
