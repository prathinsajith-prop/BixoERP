import {
  Entity as TypeOrmEntity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@TypeOrmEntity('divisions')
@Index(['tenant_id', 'organization_id'])
@Index(['tenant_id', 'organization_id', 'code'], { unique: true })
export class DivisionOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  tenant_id: string;

  @Column('uuid')
  organization_id: string;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 50 })
  code: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @Column({ type: 'uuid', nullable: true })
  head_user_id: string | null;

  @Column({ length: 20, default: 'ACTIVE' })
  status: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
