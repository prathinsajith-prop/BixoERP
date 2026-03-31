import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('file_metadata')
@Index(['tenantId', 'isDeleted'])
export class FileMetadataOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'original_name', length: 500 })
  originalName!: string;

  @Column({ name: 'mime_type', length: 100 })
  mimeType!: string;

  @Column({ name: 'size_bytes', type: 'bigint' })
  sizeBytes!: number;

  @Column({ name: 'storage_path', length: 1000 })
  storagePath!: string;

  @Column({ name: 'storage_bucket', length: 255 })
  storageBucket!: string;

  @Column({ type: 'int', default: 1 })
  version!: number;

  @Column({ name: 'tenant_id', type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ name: 'uploaded_by', type: 'uuid' })
  uploadedBy!: string;

  @Column({ type: 'jsonb', default: '[]' })
  tags!: string[];

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category!: string | null;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt!: Date | null;

  @Column({ name: 'is_deleted', default: false })
  isDeleted!: boolean;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
