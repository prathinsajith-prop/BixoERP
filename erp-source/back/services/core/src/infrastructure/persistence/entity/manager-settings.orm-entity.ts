import {
  Entity as TypeOrmEntity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@TypeOrmEntity('manager_settings')
@Index(['tenant_id', 'user_id', 'entity_type', 'entity_id'], { unique: true })
export class ManagerSettingsOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  tenant_id: string;

  @Column('uuid')
  user_id: string;

  /** Scope: 'division' | 'department' | 'team' | 'global' */
  @Column({ length: 30, default: 'global' })
  entity_type: string;

  /** null means global settings */
  @Column({ type: 'uuid', nullable: true })
  entity_id: string | null;

  // ─── Notification preferences ──────────────────────────
  @Column({ type: 'boolean', default: true })
  notify_member_join: boolean;

  @Column({ type: 'boolean', default: true })
  notify_member_leave: boolean;

  @Column({ type: 'boolean', default: true })
  notify_task_assigned: boolean;

  @Column({ type: 'boolean', default: true })
  notify_approval_request: boolean;

  @Column({ type: 'boolean', default: true })
  notify_escalation: boolean;

  @Column({ type: 'boolean', default: true })
  notify_report_ready: boolean;

  // ─── Delegation / Workflow preferences ─────────────────
  @Column({ type: 'boolean', default: false })
  auto_approve_leave: boolean;

  @Column({ type: 'boolean', default: false })
  auto_approve_expense: boolean;

  @Column({ type: 'uuid', nullable: true })
  delegate_to_user_id: string | null;

  @Column({ type: 'boolean', default: false })
  delegation_active: boolean;

  // ─── Visibility preferences ────────────────────────────
  @Column({ type: 'boolean', default: true })
  visible_in_directory: boolean;

  @Column({ type: 'boolean', default: true })
  receive_weekly_summary: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
