import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { PayrollRunOrmEntity } from './payroll-run.orm-entity';

@Entity('payroll_lines')
export class PayrollLineOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'payroll_run_id', type: 'uuid' })
  @Index()
  payrollRunId!: string;

  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId!: string;

  @Column({ name: 'base_salary', type: 'numeric', precision: 19, scale: 4 })
  baseSalary!: string;

  @Column({ type: 'numeric', precision: 19, scale: 4, default: '0.0000' })
  allowances!: string;

  @Column({ type: 'numeric', precision: 19, scale: 4, default: '0.0000' })
  deductions!: string;

  @Column({ name: 'tax_amount', type: 'numeric', precision: 19, scale: 4, default: '0.0000' })
  taxAmount!: string;

  @Column({ name: 'net_pay', type: 'numeric', precision: 19, scale: 4 })
  netPay!: string;

  @Column({ length: 3 })
  currency!: string;

  @ManyToOne(() => PayrollRunOrmEntity, (run) => run.lines, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'payroll_run_id' })
  payrollRun!: PayrollRunOrmEntity;
}
