import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  FileMetadataRepository,
  FILE_METADATA_REPOSITORY,
} from '../../domain/repositories/file-metadata.repository';
import { CachePort, CACHE_PORT } from '../ports/cache.port';
import { EntityNotFoundException } from '../../domain/exceptions/domain.exceptions';

export interface UpdateFileMetadataInput {
  fileId: string;
  tenantId: string;
  description?: string | null;
  category?: string | null;
  expiresAt?: Date | null;
  tags?: string[];
}

export interface UpdateFileMetadataOutput {
  id: string;
  description: string | null;
  category: string | null;
  expiresAt: string | null;
  tags: string[];
  updatedAt: string;
}

@Injectable()
export class UpdateFileMetadataUseCase {
  private readonly logger = new Logger(UpdateFileMetadataUseCase.name);

  constructor(
    @Inject(FILE_METADATA_REPOSITORY)
    private readonly metadataRepo: FileMetadataRepository,
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
  ) {}

  async execute(input: UpdateFileMetadataInput): Promise<UpdateFileMetadataOutput> {
    const metadata = await this.metadataRepo.findById(input.fileId, input.tenantId);
    if (!metadata) {
      throw new EntityNotFoundException('File', input.fileId);
    }

    metadata.updateMetadata({
      description: input.description,
      category: input.category,
      expiresAt: input.expiresAt,
      tags: input.tags,
    });

    const updated = await this.metadataRepo.update(metadata);

    await this.cache.del(`files:meta:${input.fileId}`);
    await this.cache.delByPattern(`files:list:${input.tenantId}*`);

    this.logger.log(`File metadata updated: ${input.fileId}`);

    return {
      id: updated.id,
      description: updated.description,
      category: updated.category,
      expiresAt: updated.expiresAt?.toISOString() ?? null,
      tags: updated.tags,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }
}
