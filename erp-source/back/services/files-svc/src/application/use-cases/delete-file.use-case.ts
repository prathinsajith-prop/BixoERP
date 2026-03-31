import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  FileMetadataRepository,
  FILE_METADATA_REPOSITORY,
} from '../../domain/repositories/file-metadata.repository';
import { StoragePort, STORAGE_PORT } from '../ports/storage.port';
import { EventPublisher, EVENT_PUBLISHER } from '../ports/event-publisher.port';
import { CachePort, CACHE_PORT } from '../ports/cache.port';
import { EntityNotFoundException } from '../../domain/exceptions/domain.exceptions';

export interface DeleteFileInput {
  fileId: string;
  tenantId: string;
  deletedBy: string;
}

@Injectable()
export class DeleteFileUseCase {
  private readonly logger = new Logger(DeleteFileUseCase.name);

  constructor(
    @Inject(FILE_METADATA_REPOSITORY)
    private readonly metadataRepo: FileMetadataRepository,
    @Inject(STORAGE_PORT)
    private readonly storage: StoragePort,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisher,
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
  ) {}

  async execute(input: DeleteFileInput): Promise<void> {
    const metadata = await this.metadataRepo.findById(input.fileId, input.tenantId);
    if (!metadata) {
      throw new EntityNotFoundException('File', input.fileId);
    }

    // Soft-delete the metadata
    metadata.softDelete();
    await this.metadataRepo.update(metadata);

    // Remove from storage
    await this.storage.delete(metadata.storageBucket, metadata.storagePath);

    // Publish domain events
    const events = metadata.clearDomainEvents();
    await this.eventPublisher.publishMany(events);

    await this.cache.del(`files:meta:${input.fileId}`);
    await this.cache.delByPattern(`files:list:${input.tenantId}*`);

    this.logger.log(`File deleted: ${input.fileId} by ${input.deletedBy}`);
  }
}
