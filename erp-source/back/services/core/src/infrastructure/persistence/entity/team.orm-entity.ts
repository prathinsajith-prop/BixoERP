import {
  Entity as TypeOrmEntity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

@TypeOrmEntity('teams')
@Index(['tenant_id', 'organization_id'])
@Index(['tenant_id', 'organization_id', 'code'], { unique: true })
export class TeamOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  tenant_id: string;

  @Column('uuid')
  organization_id: string;

  @Column({ type: 'uuid', nullable: true })
  department_id: string | null;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 50 })
  code: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @Column({ type: 'uuid', nullable: true })
  lead_user_id: string | null;

  @Column({ length: 20, default: 'ACTIVE' })
  status: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date | null;
}
