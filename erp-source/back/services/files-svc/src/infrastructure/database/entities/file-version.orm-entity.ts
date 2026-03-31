import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { FileMetadataOrmEntity } from './file-metadata.orm-entity';

@Entity('file_versions')
@Index(['fileMetadataId', 'version'], { unique: true })
export class FileVersionOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'file_metadata_id', type: 'uuid' })
  fileMetadataId!: string;

  @ManyToOne(() => FileMetadataOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'file_metadata_id' })
  fileMetadata!: FileMetadataOrmEntity;

  @Column({ type: 'int' })
  version!: number;

  @Column({ name: 'storage_path', length: 1000 })
  storagePath!: string;

  @Column({ name: 'storage_bucket', length: 255 })
  storageBucket!: string;

  @Column({ name: 'size_bytes', type: 'bigint' })
  sizeBytes!: number;

  @Column({ name: 'uploaded_by', type: 'uuid' })
  uploadedBy!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  @Index()
  tenantId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
