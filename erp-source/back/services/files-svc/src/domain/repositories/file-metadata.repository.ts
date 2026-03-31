import { FileMetadata } from '../entities/file-metadata.entity';

export interface FileMetadataRepository {
  findById(id: string, tenantId: string): Promise<FileMetadata | null>;
  findByTenant(tenantId: string, options?: { limit?: number; offset?: number; tags?: string[] }): Promise<FileMetadata[]>;
  countByTenant(tenantId: string, tags?: string[]): Promise<number>;
  save(metadata: FileMetadata): Promise<FileMetadata>;
  update(metadata: FileMetadata): Promise<FileMetadata>;
}

export const FILE_METADATA_REPOSITORY = Symbol('FileMetadataRepository');
