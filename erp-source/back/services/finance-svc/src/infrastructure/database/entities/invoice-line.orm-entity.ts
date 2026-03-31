import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { InvoiceOrmEntity } from './invoice.orm-entity';

@Entity('invoice_lines')
export class InvoiceLineOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'invoice_id', type: 'uuid' })
  invoiceId!: string;

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

  @Column({ length: 3 })
  currency!: string;

  @ManyToOne(() => InvoiceOrmEntity, (inv) => inv.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoice_id' })
  invoice!: InvoiceOrmEntity;
}
