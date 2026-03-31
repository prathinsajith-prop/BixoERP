import { z } from 'zod';

export const ListIntegrationLogsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  subscriptionId: z.string().uuid().optional(),
  eventType: z.string().optional(),
  status: z.enum(['SUCCESS', 'FAILED', 'PENDING', 'RETRYING']).optional(),
  direction: z.enum(['OUTBOUND', 'INBOUND']).optional(),
});

export type ListIntegrationLogsDto = z.infer<typeof ListIntegrationLogsSchema>;
