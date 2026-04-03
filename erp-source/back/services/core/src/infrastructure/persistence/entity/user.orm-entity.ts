import {
  Entity as TypeOrmEntity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

@TypeOrmEntity('users')
@Index(['tenant_id', 'email'], { unique: true })
export class UserOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column({ length: 255 })
  email: string;

  @Column({ length: 255 })
  hashed_password: string;

  @Column({ length: 100 })
  first_name: string;

  @Column({ length: 100 })
  last_name: string;

  @Column({ length: 30, default: 'PENDING_VERIFICATION' })
  status: string;

  @Column('uuid', { array: true, default: '{}' })
  roles: string[];

  @Column({ type: 'int', default: 0 })
  failed_login_attempts: number;

  @Column({ type: 'timestamptz', nullable: true })
  last_login_at: Date | null;

  @Column({ type: 'timestamptz' })
  password_changed_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  email_verified_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  locked_until: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date | null;
}
