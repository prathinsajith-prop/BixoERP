export interface RegisterWebhookDto {
  tenantId: string;
  url: string;
  events: string[];
  secret: string;
  description?: string;
  headers?: Record<string, string>;
  createdBy: string;
}
