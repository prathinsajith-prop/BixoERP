import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('positions')
@Index(['tenantId', 'code'], { unique: true })
@Index(['tenantId', 'departmentId'])
export class PositionOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ length: 20 })
  @Index()
  code!: string;

  @Column({ length: 255 })
  title!: string;

  @Column({ name: 'department_id', type: 'uuid' })
  departmentId!: string;

  @Column({ name: 'min_salary', type: 'numeric', precision: 19, scale: 4 })
  minSalary!: string;

  @Column({ name: 'max_salary', type: 'numeric', precision: 19, scale: 4 })
  maxSalary!: string;

  @Column({ length: 3 })
  currency!: string;

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
