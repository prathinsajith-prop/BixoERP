import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { PaymentRunLineOrmEntity } from './payment-run-line.orm-entity';

@Entity('payment_runs')
@Index(['tenantId', 'runNumber'], { unique: true })
@Index(['tenantId', 'status'])
export class PaymentRunOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'run_number', length: 30 })
  runNumber!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ name: 'payment_date', type: 'date' })
  paymentDate!: Date;

  @Column({ name: 'payment_method', length: 20 })
  paymentMethod!: string;

  @Column({ length: 20 })
  status!: string;

  @Column({ name: 'total_amount', type: 'numeric', precision: 19, scale: 4 })
  totalAmount!: string;

  @Column({ name: 'total_discount', type: 'numeric', precision: 19, scale: 4, default: '0.0000' })
  totalDiscount!: string;

  @Column({ name: 'total_net', type: 'numeric', precision: 19, scale: 4 })
  totalNet!: string;

  @Column({ length: 3 })
  currency!: string;

  @Column({ name: 'bank_account_id', type: 'uuid' })
  bankAccountId!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: string;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy!: string | null;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt!: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => PaymentRunLineOrmEntity, (line) => line.paymentRun, {
    cascade: true,
    eager: true,
  })
  lines!: PaymentRunLineOrmEntity[];
}
