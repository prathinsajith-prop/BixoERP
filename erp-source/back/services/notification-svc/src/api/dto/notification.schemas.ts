import { z } from 'zod';

export const ListNotificationsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  unreadOnly: z.coerce.boolean().optional().default(false),
});

export const MarkAsReadSchema = z.object({
  notificationId: z.string().uuid(),
});

export const MarkBatchAsReadSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
});

export type ListNotificationsDto = z.infer<typeof ListNotificationsSchema>;
export type MarkAsReadDto = z.infer<typeof MarkAsReadSchema>;
export type MarkBatchAsReadDto = z.infer<typeof MarkBatchAsReadSchema>;
