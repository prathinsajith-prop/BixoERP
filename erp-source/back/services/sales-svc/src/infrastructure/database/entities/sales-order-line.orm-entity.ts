import {
  Entity,
  Column,
  PrimaryColumn,
  Index,
} from 'typeorm';

@Entity('sales_order_lines')
@Index(['orderId'])
export class SalesOrderLineOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId!: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @Column({ name: 'product_name', length: 255 })
  productName!: string;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ name: 'unit_price', type: 'numeric', precision: 19, scale: 4 })
  unitPrice!: string;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0 })
  discount!: string;

  @Column({ name: 'line_total', type: 'numeric', precision: 19, scale: 4 })
  lineTotal!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  @Index()
  tenantId!: string;
}
