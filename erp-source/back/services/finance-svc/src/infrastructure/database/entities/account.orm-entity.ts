import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('accounts')
@Index(['tenantId', 'code'], { unique: true })
export class AccountOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ length: 20 })
  @Index()
  code!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ length: 20 })
  type!: string; // ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE

  @Column({ name: 'normal_balance', length: 10 })
  normalBalance!: string; // DEBIT, CREDIT

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId!: string | null;

  @Column({ name: 'group_id', type: 'uuid', nullable: true })
  groupId!: string | null;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'tenant_id', type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
