import { ApiClient } from "../client";
import type { WebhookSubscription } from "@erp/shared";

export const integrationsApi = (client: ApiClient) => ({
  webhooks: {
    list: (params?: Record<string, string | number | boolean | undefined>) =>
      client.list<WebhookSubscription>("/api/v1/integrations/webhooks", params),
    get: (id: string) => client.get<WebhookSubscription>(`/api/v1/integrations/webhooks/${id}`),
    create: (data: Partial<WebhookSubscription>) => client.post<WebhookSubscription>("/api/v1/integrations/webhooks", data),
    update: (id: string, data: Partial<WebhookSubscription>) =>
      client.put<WebhookSubscription>(`/api/v1/integrations/webhooks/${id}`, data),
    delete: (id: string) => client.delete(`/api/v1/integrations/webhooks/${id}`),
  },
});
