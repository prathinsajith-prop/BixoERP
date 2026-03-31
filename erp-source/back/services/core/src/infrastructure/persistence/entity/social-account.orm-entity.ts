import {
  Entity as TypeOrmEntity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';

@TypeOrmEntity('social_accounts')
@Unique(['tenant_id', 'provider', 'provider_account_id'])
export class SocialAccountOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  tenant_id: string;

  @Column('uuid')
  @Index()
  user_id: string;

  @Column({ length: 20 })
  provider: string;

  @Column({ length: 255 })
  provider_account_id: string;

  @Column({ length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  display_name: string | null;

  @Column({ type: 'text', nullable: true })
  avatar_url: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
