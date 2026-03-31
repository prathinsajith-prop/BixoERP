import { NotificationTemplate } from '../entities/notification-template.entity';

export interface TemplateRepository {
  save(template: NotificationTemplate): Promise<void>;
  findById(id: string, tenantId: string): Promise<NotificationTemplate | null>;
  findByCode(code: string, tenantId: string): Promise<NotificationTemplate | null>;
  findAll(tenantId: string, options?: { activeOnly?: boolean }): Promise<NotificationTemplate[]>;
  delete(id: string, tenantId: string): Promise<void>;
}

export const TEMPLATE_REPOSITORY = Symbol('TemplateRepository');
