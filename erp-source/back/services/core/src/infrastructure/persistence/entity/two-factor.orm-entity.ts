import {
  Entity as TypeOrmEntity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@TypeOrmEntity('two_factor_auth')
export class TwoFactorOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  tenant_id: string;

  @Column('uuid', { unique: true })
  @Index()
  user_id: string;

  /** AES-256-GCM encrypted TOTP secret */
  @Column({ type: 'text' })
  encrypted_secret: string;

  /** Hashed recovery codes (bcrypt), stored as text[] */
  @Column('text', { array: true, default: '{}' })
  recovery_codes: string[];

  @Column({ type: 'boolean', default: false })
  enabled: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
