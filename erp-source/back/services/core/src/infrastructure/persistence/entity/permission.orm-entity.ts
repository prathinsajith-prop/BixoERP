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
@Unique(['tenant_id', 'resource', 'action', 'scope'])
export class PermissionOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  tenant_id: string;

  @Column({ length: 100 })
  resource: string; // 'invoice', 'employee', 'payroll', etc.

  @Column({ length: 50 })
  action: string; // 'create' | 'read' | 'update' | 'delete' | 'approve' | 'export' | 'all'

  // scope determines what data the permission applies to
  @Column({ length: 30, default: 'organisation' })
  scope: string; // 'own' | 'department' | 'organisation' | 'all'

  @Column({ type: 'text', default: '' })
  description: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date | null;
}
