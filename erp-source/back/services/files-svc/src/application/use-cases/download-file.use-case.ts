import { Injectable, Inject } from '@nestjs/common';
import { Readable } from 'stream';
import {
  FileMetadataRepository,
  FILE_METADATA_REPOSITORY,
} from '../../domain/repositories/file-metadata.repository';
import { StoragePort, STORAGE_PORT } from '../ports/storage.port';
import { CachePort, CACHE_PORT } from '../ports/cache.port';
import { EntityNotFoundException } from '../../domain/exceptions/domain.exceptions';

export interface DownloadFileInput {
  fileId: string;
  tenantId: string;
}

export interface DownloadFileOutput {
  body: Readable;
  contentType: string;
  originalName: string;
  sizeBytes: number;
}

@Injectable()
export class DownloadFileUseCase {
  constructor(
    @Inject(FILE_METADATA_REPOSITORY)
    private readonly metadataRepo: FileMetadataRepository,
    @Inject(STORAGE_PORT)
    private readonly storage: StoragePort,
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
  ) {}

  async execute(input: DownloadFileInput): Promise<DownloadFileOutput> {
    const metadata = await this.metadataRepo.findById(input.fileId, input.tenantId);
    if (!metadata || metadata.isDeleted) {
      throw new EntityNotFoundException('File', input.fileId);
    }

    const { body, contentType } = await this.storage.download(
      metadata.storageBucket,
      metadata.storagePath,
    );

    return {
      body,
      contentType: contentType || metadata.mimeType,
      originalName: metadata.originalName,
      sizeBytes: metadata.sizeBytes,
    };
  }
}
