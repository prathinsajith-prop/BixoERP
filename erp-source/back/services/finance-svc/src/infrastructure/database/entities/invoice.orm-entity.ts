import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { InvoiceLineOrmEntity } from './invoice-line.orm-entity';

@Entity('invoices')
@Index(['tenantId', 'invoiceNumber'], { unique: true })
@Index(['tenantId', 'customerId'])
@Index(['tenantId', 'status'])
export class InvoiceOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'invoice_number', length: 30 })
  invoiceNumber!: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId!: string;

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

  @Column({ name: 'tenant_id', type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => InvoiceLineOrmEntity, (line) => line.invoice, {
    cascade: true,
    eager: true,
  })
  lines!: InvoiceLineOrmEntity[];
}
