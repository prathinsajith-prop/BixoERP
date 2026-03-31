import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('sales_orders')
@Index(['tenantId', 'orderNumber'], { unique: true })
@Index(['tenantId', 'customerId'])
@Index(['tenantId', 'status'])
export class SalesOrderOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'order_number', length: 30 })
  orderNumber!: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId!: string;

  @Column({ name: 'customer_name', length: 255 })
  customerName!: string;

  @Column({ length: 20 })
  status!: string; // DRAFT, CONFIRMED, FULFILLED, CANCELLED

  @Column({ length: 3 })
  currency!: string;

  @Column({ type: 'numeric', precision: 19, scale: 4 })
  subtotal!: string;

  @Column({ name: 'tax_rate', type: 'numeric', precision: 5, scale: 2 })
  taxRate!: string;

  @Column({ name: 'tax_amount', type: 'numeric', precision: 19, scale: 4 })
  taxAmount!: string;

  @Column({ name: 'total_amount', type: 'numeric', precision: 19, scale: 4 })
  totalAmount!: string;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'quotation_id', type: 'uuid', nullable: true })
  quotationId!: string | null;

  @Column({ name: 'tenant_id', type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: string;

  @Column({ name: 'confirmed_at', type: 'timestamptz', nullable: true })
  confirmedAt!: Date | null;

  @Column({ name: 'fulfilled_at', type: 'timestamptz', nullable: true })
  fulfilledAt!: Date | null;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt!: Date | null;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
