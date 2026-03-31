import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  Inject,
  Res,
  UploadedFile,
  UseInterceptors,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Response } from 'express';
import { TenantId, CurrentUser } from '../decorators/tenant.decorator';
import { ZodValidationPipe } from '../middleware/zod-validation.pipe';
import {
  UploadFileDto,
  UploadFileDtoType,
  UpdateFileTagsDto,
  UpdateFileTagsDtoType,
  UpdateFileMetadataDto,
  UpdateFileMetadataDtoType,
  ListFilesQueryDto,
  ListFilesQueryDtoType,
} from '../dto/file.dto';
import { UploadFileUseCase } from '../../application/use-cases/upload-file.use-case';
import { DownloadFileUseCase } from '../../application/use-cases/download-file.use-case';
import { DeleteFileUseCase } from '../../application/use-cases/delete-file.use-case';
import { ListFilesUseCase } from '../../application/use-cases/list-files.use-case';
import { UpdateFileMetadataUseCase } from '../../application/use-cases/update-file-metadata.use-case';
import {
  FileMetadataRepository,
  FILE_METADATA_REPOSITORY,
} from '../../domain/repositories/file-metadata.repository';
import { CACHE_PORT, CachePort } from '../../application/ports/cache.port';
import { EntityNotFoundException } from '../../domain/exceptions/domain.exceptions';

@ApiTags('Files')
@ApiBearerAuth()
@Controller('api/v1/files')
export class FileController {
  constructor(
    private readonly uploadFileUseCase: UploadFileUseCase,
    private readonly downloadFileUseCase: DownloadFileUseCase,
    private readonly deleteFileUseCase: DeleteFileUseCase,
    private readonly listFilesUseCase: ListFilesUseCase,
    private readonly updateFileMetadataUseCase: UpdateFileMetadataUseCase,
    @Inject(FILE_METADATA_REPOSITORY)
    private readonly metadataRepo: FileMetadataRepository,
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
  ) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        tags: { type: 'string', description: 'JSON array of tags' },
        existingFileId: { type: 'string', description: 'UUID of existing file to version' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @TenantId() tenantId: string,
    @CurrentUser() user: { userId: string },
    @UploadedFile() file: Express.Multer.File,
    @Body() body: Record<string, string>,
  ) {
    const parsed: UploadFileDtoType = UploadFileDto.parse({
      tags: body.tags ? JSON.parse(body.tags) : undefined,
      existingFileId: body.existingFileId || undefined,
      description: body.description || undefined,
      category: body.category || undefined,
      expiresAt: body.expiresAt || undefined,
    });

    const result = await this.uploadFileUseCase.execute({
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      buffer: file.buffer,
      tenantId,
      uploadedBy: user.userId,
      tags: parsed.tags,
      description: parsed.description,
      category: parsed.category,
      expiresAt: parsed.expiresAt,
      existingFileId: parsed.existingFileId,
    });

    return { data: result };
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download a file' })
  @ApiParam({ name: 'id', type: String })
  async download(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const result = await this.downloadFileUseCase.execute({
      fileId: id,
      tenantId,
    });

    const disposition = result.contentType.startsWith('image/')
      ? `inline; filename="${encodeURIComponent(result.originalName)}"`
      : `attachment; filename="${encodeURIComponent(result.originalName)}"`;

    res.set({
      'Content-Type': result.contentType,
      'Content-Disposition': disposition,
      'Content-Length': result.sizeBytes,
    });

    result.body.pipe(res);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a file (soft-delete)' })
  @ApiParam({ name: 'id', type: String })
  async delete(
    @TenantId() tenantId: string,
    @CurrentUser() user: { userId: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.deleteFileUseCase.execute({
      fileId: id,
      tenantId,
      deletedBy: user.userId,
    });

    return { data: { deleted: true } };
  }

  @Get()
  @ApiOperation({ summary: 'List files for the current tenant' })
  async list(
    @TenantId() tenantId: string,
    @Query(new ZodValidationPipe(ListFilesQueryDto)) query: ListFilesQueryDtoType,
  ) {
    const result = await this.listFilesUseCase.execute({
      tenantId,
      limit: query.limit,
      offset: query.offset,
      tags: query.tags,
    });

    return { data: result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get file metadata by ID' })
  @ApiParam({ name: 'id', type: String })
  async getMetadata(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const cacheKey = `files:meta:${id}`;
    const cached = await this.cache.get<Record<string, unknown>>(cacheKey);
    if (cached) return { data: cached };

    const metadata = await this.metadataRepo.findById(id, tenantId);
    if (!metadata) {
      throw new EntityNotFoundException('File', id);
    }

    const data = {
      id: metadata.id,
      originalName: metadata.originalName,
      mimeType: metadata.mimeType,
      sizeBytes: metadata.sizeBytes,
      version: metadata.version,
      tags: metadata.tags,
      description: metadata.description,
      category: metadata.category,
      expiresAt: metadata.expiresAt?.toISOString() ?? null,
      uploadedBy: metadata.uploadedBy,
      storagePath: metadata.storagePath,
      createdAt: metadata.createdAt.toISOString(),
      updatedAt: metadata.updatedAt.toISOString(),
    };

    await this.cache.set(cacheKey, data, 300);
    return { data };
  }

  @Patch(':id/tags')
  @ApiOperation({ summary: 'Update file tags' })
  @ApiParam({ name: 'id', type: String })
  async updateTags(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdateFileTagsDto)) body: UpdateFileTagsDtoType,
  ) {
    const metadata = await this.metadataRepo.findById(id, tenantId);
    if (!metadata) {
      throw new EntityNotFoundException('File', id);
    }

    metadata.updateTags(body.tags);
    const updated = await this.metadataRepo.update(metadata);

    await this.cache.del(`files:meta:${id}`);
    await this.cache.delByPattern(`files:list:${tenantId}*`);

    return {
      data: {
        id: updated.id,
        tags: updated.tags,
        updatedAt: updated.updatedAt.toISOString(),
      },
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update file metadata (description, category, expiry, tags)' })
  @ApiParam({ name: 'id', type: String })
  async updateMetadata(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdateFileMetadataDto)) body: UpdateFileMetadataDtoType,
  ) {
    const result = await this.updateFileMetadataUseCase.execute({
      fileId: id,
      tenantId,
      description: body.description,
      category: body.category,
      expiresAt: body.expiresAt,
      tags: body.tags,
    });

    return { data: result };
  }
}
