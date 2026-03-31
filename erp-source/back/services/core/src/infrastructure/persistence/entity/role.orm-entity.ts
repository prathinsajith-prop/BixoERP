import {
  Entity as TypeOrmEntity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@TypeOrmEntity('roles')
@Index(['tenant_id', 'name'], { unique: true })
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

  @Column({ type: 'boolean', default: false })
  is_system: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
