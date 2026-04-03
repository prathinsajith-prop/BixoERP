import {
  Entity as TypeOrmEntity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';

@TypeOrmEntity('user_organizations')
@Unique(['user_id', 'organization_id'])
export class UserOrganizationOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  user_id: string;

  @Column('uuid')
  @Index()
  organization_id: string;

  // membership_type mirrors the high-level role category
  @Column({ length: 30, default: 'MEMBER' })
  role: string; // OWNER | ADMIN | MEMBER | GUEST

  // FK → roles.id — the full role record in this org
  @Column({ type: 'uuid', nullable: true })
  role_id: string | null;

  // membership_type for UI display (owner/admin/member/guest)
  @Column({ length: 20, default: 'MEMBER' })
  membership_type: string;

  @Column({ length: 20, default: 'active' })
  status: string;

  // nullable FK → employees table in hr-svc (cross-service reference)
  @Column({ type: 'uuid', nullable: true })
  employee_id: string | null;

  // who sent the invite — FK → users
  @Column({ type: 'uuid', nullable: true })
  invited_by: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  joined_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  left_at: Date | null;
}
