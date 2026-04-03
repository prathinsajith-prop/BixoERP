import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('customers')
@Index(['tenantId', 'customerNumber'], { unique: true })
@Index(['tenantId', 'email'], { unique: true })
export class CustomerOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'customer_number', length: 30 })
  customerNumber!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone!: string | null;

  @Column({ name: 'billing_address', type: 'text', nullable: true })
  billingAddress!: string | null;

  @Column({ name: 'shipping_address', type: 'text', nullable: true })
  shippingAddress!: string | null;

  @Column({ name: 'tax_id', type: 'varchar', length: 50, nullable: true })
  taxId!: string | null;

  @Column({ name: 'credit_limit', type: 'numeric', precision: 19, scale: 4, default: '0.0000' })
  creditLimit!: string;

  @Column({ length: 3 })
  currency!: string;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

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
