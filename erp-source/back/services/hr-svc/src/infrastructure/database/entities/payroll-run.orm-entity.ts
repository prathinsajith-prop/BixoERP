import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { PayrollLineOrmEntity } from './payroll-line.orm-entity';

@Entity('payroll_runs')
@Index(['tenantId', 'runNumber'], { unique: true })
@Index(['tenantId', 'periodYear', 'periodMonth'])
export class PayrollRunOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'run_number', length: 30 })
  runNumber!: string;

  @Column({ name: 'period_year', type: 'int' })
  periodYear!: number;

  @Column({ name: 'period_month', type: 'int' })
  periodMonth!: number;

  @Column({ length: 20 })
  status!: string; // DRAFT, PROCESSING, COMPLETED, FAILED, CANCELLED

  @Column({ name: 'total_gross', type: 'numeric', precision: 19, scale: 4 })
  totalGross!: string;

  @Column({ name: 'total_deductions', type: 'numeric', precision: 19, scale: 4 })
  totalDeductions!: string;

  @Column({ name: 'total_net', type: 'numeric', precision: 19, scale: 4 })
  totalNet!: string;

  @Column({ length: 3 })
  currency!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: string;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => PayrollLineOrmEntity, (line) => line.payrollRun, {
    cascade: true,
    // eager removed — use relations: ['lines'] only where lines are needed
  })
  lines!: PayrollLineOrmEntity[];
}
