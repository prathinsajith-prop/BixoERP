export interface DeliverWebhookDto {
  eventType: string;
  tenantId: string;
  payload: Record<string, unknown>;
  eventId: string;
}
