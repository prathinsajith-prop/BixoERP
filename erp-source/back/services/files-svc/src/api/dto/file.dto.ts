import { z } from 'zod';

// --- Upload ---

export const UploadFileDto = z.object({
  tags: z.array(z.string().max(50)).max(20).optional(),
  existingFileId: z.string().uuid().optional(),
  description: z.string().max(2000).optional(),
  category: z.string().max(100).optional(),
  expiresAt: z
    .string()
    .datetime()
    .transform((v) => new Date(v))
    .optional(),
});

export type UploadFileDtoType = z.infer<typeof UploadFileDto>;

// --- Update Tags ---

export const UpdateFileTagsDto = z.object({
  tags: z.array(z.string().max(50)).max(20),
});

export type UpdateFileTagsDtoType = z.infer<typeof UpdateFileTagsDto>;

// --- Update Metadata ---

export const UpdateFileMetadataDto = z.object({
  description: z.string().max(2000).nullish(),
  category: z.string().max(100).nullish(),
  expiresAt: z
    .string()
    .datetime()
    .transform((v) => new Date(v))
    .nullish(),
  tags: z.array(z.string().max(50)).max(20).optional(),
});

export type UpdateFileMetadataDtoType = z.infer<typeof UpdateFileMetadataDto>;

// --- List Query ---

export const ListFilesQueryDto = z.object({
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 20))
    .pipe(z.number().int().positive().max(100)),
  offset: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 0))
    .pipe(z.number().int().min(0)),
  tags: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(',').map((t) => t.trim()) : undefined)),
});

export type ListFilesQueryDtoType = z.infer<typeof ListFilesQueryDto>;
