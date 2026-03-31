import {
  Entity as TypeOrmEntity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@TypeOrmEntity('manager_assignments')
@Index(['tenant_id', 'entity_type', 'entity_id'])
@Index(['tenant_id', 'user_id'])
@Index(['tenant_id', 'entity_type', 'entity_id', 'user_id', 'role'], { unique: true })
export class ManagerAssignmentOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  tenant_id: string;

  /** 'division' | 'department' | 'team' */
  @Column({ length: 30 })
  entity_type: string;

  @Column('uuid')
  entity_id: string;

  @Column('uuid')
  user_id: string;

  /** 'manager' | 'assistant_manager' */
  @Column({ length: 30 })
  role: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
