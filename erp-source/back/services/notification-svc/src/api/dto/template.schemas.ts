import { z } from 'zod';

export const CreateTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Code must be lowercase alphanumeric with dashes'),
  channel: z.enum(['EMAIL', 'IN_APP', 'PUSH', 'SMS']),
  subjectTemplate: z.string().min(1),
  bodyTemplate: z.string().min(1),
  variables: z.array(z.object({
    name: z.string().min(1),
    type: z.enum(['string', 'number', 'date', 'boolean']),
    required: z.boolean(),
    defaultValue: z.string().optional(),
  })).default([]),
});

export const UpdateTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  subjectTemplate: z.string().min(1).optional(),
  bodyTemplate: z.string().min(1).optional(),
  variables: z.array(z.object({
    name: z.string().min(1),
    type: z.enum(['string', 'number', 'date', 'boolean']),
    required: z.boolean(),
    defaultValue: z.string().optional(),
  })).optional(),
  isActive: z.boolean().optional(),
});

export type CreateTemplateRequestDto = z.infer<typeof CreateTemplateSchema>;
export type UpdateTemplateRequestDto = z.infer<typeof UpdateTemplateSchema>;
