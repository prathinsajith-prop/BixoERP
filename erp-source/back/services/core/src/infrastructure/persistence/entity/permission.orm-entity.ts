import {
  Entity as TypeOrmEntity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  Unique,
} from 'typeorm';

@TypeOrmEntity('permissions')
@Unique(['tenant_id', 'resource', 'action'])
export class PermissionOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  tenant_id: string;

  @Column({ length: 100 })
  resource: string;

  @Column({ length: 50 })
  action: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date | null;
}
