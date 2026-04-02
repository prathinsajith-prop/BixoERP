import { ApiClient, workflowApi } from "@erp/api-client";
import { useAuthStore } from "@erp/shell";

const client = new ApiClient({
    baseUrl: typeof window !== "undefined" ? window.location.origin : "",
    getToken: async () =>
        typeof window !== "undefined" ? useAuthStore.getState().accessToken : null,
});

export const api = workflowApi(client);
export type { ApprovalRequest } from "@erp/shared";
