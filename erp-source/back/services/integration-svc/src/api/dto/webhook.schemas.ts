import { z } from 'zod';

export const RegisterWebhookSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  events: z.array(z.string().min(1)).min(1, 'At least one event required'),
  secret: z.string().min(16, 'Secret must be at least 16 characters'),
  description: z.string().max(500).optional(),
  headers: z.record(z.string()).optional(),
});

export const UpdateWebhookSchema = z.object({
  url: z.string().url('Must be a valid URL').optional(),
  events: z.array(z.string().min(1)).min(1).optional(),
  description: z.string().max(500).optional(),
  headers: z.record(z.string()).optional(),
});

export const ListWebhooksSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
});

export const TestWebhookSchema = z.object({
  eventType: z.string().min(1, 'Event type is required'),
  payload: z.record(z.unknown()).optional(),
});

export type RegisterWebhookDto = z.infer<typeof RegisterWebhookSchema>;
export type UpdateWebhookDto = z.infer<typeof UpdateWebhookSchema>;
export type ListWebhooksDto = z.infer<typeof ListWebhooksSchema>;
export type TestWebhookDto = z.infer<typeof TestWebhookSchema>;
