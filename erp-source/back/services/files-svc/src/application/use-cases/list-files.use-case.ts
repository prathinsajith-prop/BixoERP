import { Injectable, Inject } from '@nestjs/common';
import {
  FileMetadataRepository,
  FILE_METADATA_REPOSITORY,
} from '../../domain/repositories/file-metadata.repository';
import { CachePort, CACHE_PORT } from '../ports/cache.port';

export interface ListFilesInput {
  tenantId: string;
  limit?: number;
  offset?: number;
  tags?: string[];
}

export interface ListFilesOutput {
  items: Array<{
    id: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    version: number;
    tags: string[];
    uploadedBy: string;
    createdAt: string;
    updatedAt: string;
  }>;
  total: number;
  limit: number;
  offset: number;
}

@Injectable()
export class ListFilesUseCase {
  constructor(
    @Inject(FILE_METADATA_REPOSITORY)
    private readonly metadataRepo: FileMetadataRepository,
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
  ) {}

  async execute(input: ListFilesInput): Promise<ListFilesOutput> {
    const limit = input.limit ?? 20;
    const offset = input.offset ?? 0;
    const tagsKey = input.tags ? `:tags=${input.tags.sort().join(',')}` : '';
    const cacheKey = `files:list:${input.tenantId}:${limit}:${offset}${tagsKey}`;

    const cached = await this.cache.get<ListFilesOutput>(cacheKey);
    if (cached) return cached;

    const [items, total] = await Promise.all([
      this.metadataRepo.findByTenant(input.tenantId, { limit, offset, tags: input.tags }),
      this.metadataRepo.countByTenant(input.tenantId, input.tags),
    ]);

    const result: ListFilesOutput = {
      items: items.map((f) => ({
        id: f.id,
        originalName: f.originalName,
        mimeType: f.mimeType,
        sizeBytes: f.sizeBytes,
        version: f.version,
        tags: f.tags,
        uploadedBy: f.uploadedBy,
        createdAt: f.createdAt.toISOString(),
        updatedAt: f.updatedAt.toISOString(),
      })),
      total,
      limit,
      offset,
    };

    await this.cache.set(cacheKey, result, 120);
    return result;
  }
}
