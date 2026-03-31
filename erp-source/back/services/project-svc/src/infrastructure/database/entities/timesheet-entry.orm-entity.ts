import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('timesheet_entries')
@Index(['tenantId', 'projectId'])
@Index(['tenantId', 'employeeId'])
@Index(['tenantId', 'date'])
export class TimesheetEntryOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId!: string;

  @Column({ name: 'task_id', type: 'uuid', nullable: true })
  taskId!: string | null;

  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId!: string;

  @Column({ type: 'date' })
  date!: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  hours!: number;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'boolean', default: true })
  billable!: boolean;

  @Column({ type: 'boolean', default: false })
  approved!: boolean;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy!: string | null;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt!: Date | null;

  @Column({ name: 'tenant_id', type: 'uuid' })
  @Index()
  tenantId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
