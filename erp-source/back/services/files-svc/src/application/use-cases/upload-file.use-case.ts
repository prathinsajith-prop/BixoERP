import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { FileMetadata } from '../../domain/entities/file-metadata.entity';
import { FileVersion } from '../../domain/entities/file-version.entity';
import {
  FileMetadataRepository,
  FILE_METADATA_REPOSITORY,
} from '../../domain/repositories/file-metadata.repository';
import { StoragePort, STORAGE_PORT } from '../ports/storage.port';
import { EventPublisher, EVENT_PUBLISHER } from '../ports/event-publisher.port';
import { CachePort, CACHE_PORT } from '../ports/cache.port';
import { FileTooLargeException } from '../../domain/exceptions/domain.exceptions';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileVersionOrmEntity } from '../../infrastructure/database/entities/file-version.orm-entity';

export interface UploadFileInput {
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  buffer: Buffer;
  tenantId: string;
  uploadedBy: string;
  tags?: string[];
  description?: string;
  category?: string;
  expiresAt?: Date;
  existingFileId?: string; // If provided, creates a new version
}

export interface UploadFileOutput {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  version: number;
  storagePath: string;
}

@Injectable()
export class UploadFileUseCase {
  private readonly logger = new Logger(UploadFileUseCase.name);

  constructor(
    @Inject(FILE_METADATA_REPOSITORY)
    private readonly metadataRepo: FileMetadataRepository,
    @Inject(STORAGE_PORT)
    private readonly storage: StoragePort,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisher,
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
    @InjectRepository(FileVersionOrmEntity)
    private readonly versionRepo: Repository<FileVersionOrmEntity>,
    private readonly config: ConfigService,
  ) {}

  async execute(input: UploadFileInput): Promise<UploadFileOutput> {
    const maxSizeBytes =
      (this.config.get<number>('storage.maxFileSizeMb') || 50) * 1024 * 1024;
    if (input.sizeBytes > maxSizeBytes) {
      throw new FileTooLargeException(input.sizeBytes, maxSizeBytes);
    }

    const bucket = this.config.get<string>('storage.bucket')!;

    // New version of existing file
    if (input.existingFileId) {
      return this.createNewVersion(input, bucket);
    }

    // Brand new file
    const storageKey = this.buildStorageKey(input.tenantId, input.originalName);

    await this.storage.upload(bucket, storageKey, input.buffer, input.mimeType);

    const metadata = FileMetadata.create({
      originalName: input.originalName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      storageBucket: bucket,
      storagePath: storageKey,
      tenantId: input.tenantId,
      uploadedBy: input.uploadedBy,
      tags: input.tags,
      description: input.description,
      category: input.category,
      expiresAt: input.expiresAt,
    });

    const saved = await this.metadataRepo.save(metadata);

    // Save initial version record
    const versionEntity = new FileVersionOrmEntity();
    versionEntity.id = uuidv4();
    versionEntity.fileMetadataId = saved.id;
    versionEntity.version = 1;
    versionEntity.storagePath = storageKey;
    versionEntity.storageBucket = bucket;
    versionEntity.sizeBytes = input.sizeBytes;
    versionEntity.uploadedBy = input.uploadedBy;
    versionEntity.tenantId = input.tenantId;
    await this.versionRepo.save(versionEntity);

    // Publish domain events
    const events = metadata.clearDomainEvents();
    await this.eventPublisher.publishMany(events);
    await this.cache.delByPattern(`files:list:${input.tenantId}*`);

    this.logger.log(`File uploaded: ${saved.id} (${input.originalName})`);

    return {
      id: saved.id,
      originalName: saved.originalName,
      mimeType: saved.mimeType,
      sizeBytes: saved.sizeBytes,
      version: saved.version,
      storagePath: saved.storagePath,
    };
  }

  private async createNewVersion(
    input: UploadFileInput,
    bucket: string,
  ): Promise<UploadFileOutput> {
    const existing = await this.metadataRepo.findById(
      input.existingFileId!,
      input.tenantId,
    );
    if (!existing) {
      throw new Error(`File not found: ${input.existingFileId}`);
    }

    const newVersion = existing.version + 1;
    const storageKey = this.buildStorageKey(
      input.tenantId,
      input.originalName,
      newVersion,
    );

    await this.storage.upload(bucket, storageKey, input.buffer, input.mimeType);

    existing.bumpVersion(storageKey, input.sizeBytes);
    const updated = await this.metadataRepo.update(existing);

    // Save version record
    const versionEntity = new FileVersionOrmEntity();
    versionEntity.id = uuidv4();
    versionEntity.fileMetadataId = updated.id;
    versionEntity.version = newVersion;
    versionEntity.storagePath = storageKey;
    versionEntity.storageBucket = bucket;
    versionEntity.sizeBytes = input.sizeBytes;
    versionEntity.uploadedBy = input.uploadedBy;
    versionEntity.tenantId = input.tenantId;
    await this.versionRepo.save(versionEntity);

    const events = existing.clearDomainEvents();
    await this.eventPublisher.publishMany(events);
    await this.cache.del(`files:meta:${updated.id}`);
    await this.cache.delByPattern(`files:list:${input.tenantId}*`);

    return {
      id: updated.id,
      originalName: updated.originalName,
      mimeType: updated.mimeType,
      sizeBytes: updated.sizeBytes,
      version: updated.version,
      storagePath: updated.storagePath,
    };
  }

  private buildStorageKey(
    tenantId: string,
    originalName: string,
    version?: number,
  ): string {
    const timestamp = Date.now();
    const fileId = uuidv4().slice(0, 8);
    const versionSuffix = version ? `/v${version}` : '';
    return `${tenantId}/${timestamp}-${fileId}${versionSuffix}/${originalName}`;
  }
}
