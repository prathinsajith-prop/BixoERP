import {
  Entity as TypeOrmEntity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@TypeOrmEntity('organizations')
export class OrganizationOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 200 })
  @Index({ unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 500, default: '' })
  description: string;

  @Column({ length: 30, default: 'ACTIVE' })
  status: string;

  @Column('uuid')
  owner_id: string;

  @Column({ type: 'varchar', length: 7, default: '#2563eb' })
  primary_color: string;

  @Column({ type: 'varchar', length: 7, default: '#1e40af' })
  secondary_color: string;

  @Column({ type: 'varchar', length: 7, default: '#3b82f6' })
  accent_color: string;

  @Column({ type: 'varchar', length: 500, default: '' })
  logo_url: string;

  @Column({ type: 'varchar', length: 500, default: '' })
  favicon_url: string;

  @Column({ type: 'text', default: '' })
  custom_css: string;

  @Column({ type: 'jsonb', default: '{}' })
  settings: Record<string, any>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
