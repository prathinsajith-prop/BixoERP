import { Notification } from '../entities/notification.entity';

export interface NotificationRepository {
  save(notification: Notification): Promise<void>;
  findById(id: string, tenantId: string): Promise<Notification | null>;
  findByRecipient(tenantId: string, userId: string, options?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }): Promise<Notification[]>;
  countUnread(tenantId: string, userId: string): Promise<number>;
  markManyAsRead(ids: string[], tenantId: string): Promise<void>;
}

export const NOTIFICATION_REPOSITORY = Symbol('NotificationRepository');
