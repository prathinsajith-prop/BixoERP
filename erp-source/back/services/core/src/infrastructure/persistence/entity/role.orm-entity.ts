import {
  Entity as TypeOrmEntity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

@TypeOrmEntity('roles')
@Index(['tenant_id', 'name'], { unique: true })
@Index(['tenant_id', 'code'], { unique: true, where: '"code" IS NOT NULL' })
export class RoleOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  tenant_id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @Column('uuid', { array: true, default: '{}' })
  permissions: string[];

  @Column({ nullable: true, type: 'text' })
  code: string | null;

  @Column({ type: 'boolean', default: false })
  is_system: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date | null;
}
