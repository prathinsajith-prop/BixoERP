import { ApiClient } from "../client";
import type { ApprovalRequest } from "@erp/shared";

export const workflowApi = (client: ApiClient) => ({
  approvals: {
    list: (params?: Record<string, string | number | boolean | undefined>) =>
      client.list<ApprovalRequest>("/api/v1/workflow/approvals", params),
    get: (id: string) => client.get<ApprovalRequest>(`/api/v1/workflow/approvals/${id}`),
    approve: (id: string, comment?: string) => client.post(`/api/v1/workflow/approvals/${id}/approve`, { comment }),
    reject: (id: string, comment: string) => client.post(`/api/v1/workflow/approvals/${id}/reject`, { comment }),
  },
});
