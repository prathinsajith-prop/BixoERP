import { ApiClient } from "../client";
import type { AuditLogEntry } from "@erp/shared";

export const auditApi = (client: ApiClient) => ({
  logs: {
    list: (params?: Record<string, string | number | boolean | undefined>) =>
      client.list<AuditLogEntry>("/api/v1/audit/logs", params),
    get: (id: string) => client.get<AuditLogEntry>(`/api/v1/audit/logs/${id}`),
  },
});
