import { NotificationChannel } from '../../domain/value-objects/notification-channel.vo';

export interface SendNotificationDto {
  tenantId: string;
  recipientUserId: string;
  recipientEmail?: string;
  recipientPhone?: string;
  channel: NotificationChannel;
  templateCode?: string;
  subject?: string;
  body?: string;
  variables?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}
