import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('quotations')
@Index(['tenantId', 'quotationNumber'], { unique: true })
@Index(['tenantId', 'customerId'])
@Index(['tenantId', 'status'])
export class QuotationOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'quotation_number', length: 30 })
  quotationNumber!: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId!: string;

  @Column({ name: 'customer_name', length: 255 })
  customerName!: string;

  @Column({ length: 20 })
  status!: string; // DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED

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

  @Column({ name: 'valid_until', type: 'date' })
  validUntil!: Date;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'jsonb', default: '[]' })
  lines!: Record<string, unknown>[];

  @Column({ name: 'tenant_id', type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
