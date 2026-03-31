import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileMetadataRepository } from '../../../domain/repositories/file-metadata.repository';
import { FileMetadata, FileMetadataProps } from '../../../domain/entities/file-metadata.entity';
import { FileMetadataOrmEntity } from '../entities/file-metadata.orm-entity';

@Injectable()
export class PostgresFileMetadataRepository implements FileMetadataRepository {
  constructor(
    @InjectRepository(FileMetadataOrmEntity)
    private readonly repo: Repository<FileMetadataOrmEntity>,
  ) {}

  async findById(id: string, tenantId: string): Promise<FileMetadata | null> {
    const row = await this.repo.findOne({
      where: { id, tenantId, isDeleted: false },
    });
    return row ? this.toDomain(row) : null;
  }

  async findByTenant(
    tenantId: string,
    options?: { limit?: number; offset?: number; tags?: string[] },
  ): Promise<FileMetadata[]> {
    const qb = this.repo
      .createQueryBuilder('f')
      .where('f.tenant_id = :tenantId', { tenantId })
      .andWhere('f.is_deleted = false')
      .orderBy('f.created_at', 'DESC')
      .take(options?.limit ?? 20)
      .skip(options?.offset ?? 0);

    if (options?.tags && options.tags.length > 0) {
      qb.andWhere('f.tags @> :tags', { tags: JSON.stringify(options.tags) });
    }

    const rows = await qb.getMany();
    return rows.map((r) => this.toDomain(r));
  }

  async countByTenant(tenantId: string, tags?: string[]): Promise<number> {
    const qb = this.repo
      .createQueryBuilder('f')
      .where('f.tenant_id = :tenantId', { tenantId })
      .andWhere('f.is_deleted = false');

    if (tags && tags.length > 0) {
      qb.andWhere('f.tags @> :tags', { tags: JSON.stringify(tags) });
    }

    return qb.getCount();
  }

  async save(metadata: FileMetadata): Promise<FileMetadata> {
    const entity = this.toOrm(metadata);
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  async update(metadata: FileMetadata): Promise<FileMetadata> {
    return this.save(metadata);
  }

  private toOrm(domain: FileMetadata): FileMetadataOrmEntity {
    const entity = new FileMetadataOrmEntity();
    entity.id = domain.id;
    entity.originalName = domain.originalName;
    entity.mimeType = domain.mimeType;
    entity.sizeBytes = domain.sizeBytes;
    entity.storagePath = domain.storagePath;
    entity.storageBucket = domain.storageBucket;
    entity.version = domain.version;
    entity.tenantId = domain.tenantId;
    entity.uploadedBy = domain.uploadedBy;
    entity.tags = domain.tags;
    entity.description = domain.description;
    entity.category = domain.category;
    entity.expiresAt = domain.expiresAt;
    entity.isDeleted = domain.isDeleted;
    entity.deletedAt = domain.deletedAt;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    return entity;
  }

  private toDomain(row: FileMetadataOrmEntity): FileMetadata {
    const props: FileMetadataProps = {
      originalName: row.originalName,
      mimeType: row.mimeType,
      sizeBytes: Number(row.sizeBytes),
      storagePath: row.storagePath,
      storageBucket: row.storageBucket,
      version: row.version,
      tenantId: row.tenantId,
      uploadedBy: row.uploadedBy,
      tags: row.tags ?? [],
      description: row.description ?? null,
      category: row.category ?? null,
      expiresAt: row.expiresAt ?? null,
      isDeleted: row.isDeleted,
      deletedAt: row.deletedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return FileMetadata.reconstitute(row.id, props);
  }
}
