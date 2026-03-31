import { NotificationChannel } from '../../domain/value-objects/notification-channel.vo';
import { TemplateVariable } from '../../domain/entities/notification-template.entity';

export interface CreateTemplateDto {
  tenantId: string;
  name: string;
  code: string;
  channel: NotificationChannel;
  subjectTemplate: string;
  bodyTemplate: string;
  variables: TemplateVariable[];
}
