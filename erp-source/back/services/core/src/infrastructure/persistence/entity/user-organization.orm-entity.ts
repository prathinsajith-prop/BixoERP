import {
  Entity as TypeOrmEntity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@TypeOrmEntity('user_organizations')
@Index(['user_id', 'organization_id'], { unique: true })
export class UserOrganizationOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  user_id: string;

  @Column('uuid')
  @Index()
  organization_id: string;

  @Column({ length: 30, default: 'MEMBER' })
  role: string;

  @Column({ length: 20, default: 'active' })
  status: string;

  @CreateDateColumn({ type: 'timestamptz' })
  joined_at: Date;
}
