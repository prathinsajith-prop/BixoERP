import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PaymentRunOrmEntity } from './payment-run.orm-entity';

@Entity('payment_run_lines')
export class PaymentRunLineOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'payment_run_id', type: 'uuid' })
  paymentRunId!: string;

  @Column({ name: 'vendor_invoice_id', type: 'uuid' })
  vendorInvoiceId!: string;

  @Column({ name: 'vendor_id', type: 'uuid' })
  vendorId!: string;

  @Column({ type: 'numeric', precision: 19, scale: 4 })
  amount!: string;

  @Column({ name: 'discount_amount', type: 'numeric', precision: 19, scale: 4, default: '0.0000' })
  discountAmount!: string;

  @Column({ name: 'net_amount', type: 'numeric', precision: 19, scale: 4 })
  netAmount!: string;

  @Column({ length: 10 })
  status!: string; // PENDING, PAID, FAILED

  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason!: string | null;

  @Column({ length: 3 })
  currency!: string;

  @ManyToOne(() => PaymentRunOrmEntity, (run) => run.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payment_run_id' })
  paymentRun!: PaymentRunOrmEntity;
}
