import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { VendorInvoiceLineOrmEntity } from './vendor-invoice-line.orm-entity';

@Entity('vendor_invoices')
@Index(['tenantId', 'invoiceNumber'], { unique: true })
@Index(['tenantId', 'vendorId'])
@Index(['tenantId', 'status'])
@Index(['tenantId', 'dueDate'])
export class VendorInvoiceOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'invoice_number', length: 30 })
  invoiceNumber!: string;

  @Column({ name: 'vendor_id', type: 'uuid' })
  vendorId!: string;

  @Column({ name: 'vendor_invoice_ref', length: 100 })
  vendorInvoiceRef!: string;

  @Column({ name: 'issue_date', type: 'date' })
  issueDate!: Date;

  @Column({ name: 'due_date', type: 'date' })
  dueDate!: Date;

  @Column({ length: 20 })
  status!: string;

  @Column({ type: 'numeric', precision: 19, scale: 4 })
  subtotal!: string;

  @Column({ name: 'tax_total', type: 'numeric', precision: 19, scale: 4 })
  taxTotal!: string;

  @Column({ type: 'numeric', precision: 19, scale: 4 })
  total!: string;

  @Column({ name: 'amount_paid', type: 'numeric', precision: 19, scale: 4, default: '0.0000' })
  amountPaid!: string;

  @Column({ length: 3 })
  currency!: string;

  @Column({ name: 'payment_terms_code', length: 30 })
  paymentTermsCode!: string;

  @Column({ name: 'purchase_order_id', type: 'uuid', nullable: true })
  purchaseOrderId!: string | null;

  @Column({ name: 'goods_receipt_id', type: 'uuid', nullable: true })
  goodsReceiptId!: string | null;

  @Column({ name: 'three_way_match', type: 'jsonb', nullable: true })
  threeWayMatch!: Record<string, unknown> | null;

  @Column({ name: 'tenant_id', type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: string;

  @Column({ name: 'idempotency_key', type: 'varchar', length: 64, nullable: true })
  @Index()
  idempotencyKey!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => VendorInvoiceLineOrmEntity, (line) => line.vendorInvoice, {
    cascade: true,
    eager: true,
  })
  lines!: VendorInvoiceLineOrmEntity[];
}
