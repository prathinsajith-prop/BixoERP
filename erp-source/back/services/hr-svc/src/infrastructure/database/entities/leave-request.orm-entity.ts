import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('leave_requests')
@Index(['tenantId', 'employeeId'])
@Index(['tenantId', 'status'])
export class LeaveRequestOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId!: string;

  @Column({ name: 'leave_type', length: 20 })
  leaveType!: string; // ANNUAL, SICK, MATERNITY, PATERNITY, UNPAID, BEREAVEMENT, OTHER

  @Column({ name: 'start_date', type: 'date' })
  startDate!: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate!: Date;

  @Column({ name: 'total_days', type: 'numeric', precision: 5, scale: 1 })
  totalDays!: string;

  @Column({ type: 'text', nullable: true })
  reason!: string | null;

  @Column({ length: 20 })
  status!: string; // PENDING, APPROVED, REJECTED, CANCELLED

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy!: string | null;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason!: string | null;

  @Column({ name: 'tenant_id', type: 'uuid' })
  @Index()
  tenantId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
