import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { VendorInvoiceOrmEntity } from './vendor-invoice.orm-entity';

@Entity('vendor_invoice_lines')
export class VendorInvoiceLineOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'vendor_invoice_id', type: 'uuid' })
  vendorInvoiceId!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'numeric', precision: 12, scale: 4 })
  quantity!: string;

  @Column({ name: 'unit_price', type: 'numeric', precision: 19, scale: 4 })
  unitPrice!: string;

  @Column({ name: 'tax_code', type: 'varchar', length: 20, nullable: true })
  taxCode!: string | null;

  @Column({ name: 'tax_amount', type: 'numeric', precision: 19, scale: 4, default: '0.0000' })
  taxAmount!: string;

  @Column({ name: 'line_total', type: 'numeric', precision: 19, scale: 4 })
  lineTotal!: string;

  @Column({ name: 'account_id', type: 'uuid' })
  accountId!: string;

  @Column({ name: 'purchase_order_line_id', type: 'uuid', nullable: true })
  purchaseOrderLineId!: string | null;

  @Column({ length: 3 })
  currency!: string;

  @ManyToOne(() => VendorInvoiceOrmEntity, (inv) => inv.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendor_invoice_id' })
  vendorInvoice!: VendorInvoiceOrmEntity;
}
