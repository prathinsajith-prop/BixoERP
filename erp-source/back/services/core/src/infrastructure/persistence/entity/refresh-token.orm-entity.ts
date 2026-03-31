import {
  Entity as TypeOrmEntity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@TypeOrmEntity('refresh_tokens')
@Index(['user_id', 'revoked_at'])
export class RefreshTokenOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  tenant_id: string;

  @Column('uuid')
  @Index()
  user_id: string;

  @Column({ length: 128 })
  @Index({ unique: true })
  token_hash: string;

  @Column({ type: 'timestamptz' })
  expires_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  revoked_at: Date | null;

  @Column({ type: 'uuid', nullable: true })
  replaced_by_token_id: string | null;

  @Column({ type: 'text', nullable: true })
  user_agent: string | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip_address: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
