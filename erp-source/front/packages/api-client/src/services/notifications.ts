import { ApiClient } from "../client";
import type { Notification } from "@erp/shared";

export const notificationsApi = (client: ApiClient) => ({
  list: (params?: Record<string, string | number | boolean | undefined>) =>
    client.list<Notification>("/api/v1/notifications", params),
  markRead: (id: string) => client.patch(`/api/v1/notifications/${id}/read`),
  markAllRead: () => client.post("/api/v1/notifications/read-all"),
});
