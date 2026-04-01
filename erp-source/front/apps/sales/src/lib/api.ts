import { ApiClient, salesApi } from "@erp/api-client";
import { useAuthStore } from "@erp/shell";

const client = new ApiClient({
    baseUrl: typeof window !== "undefined" ? window.location.origin : "",
    getToken: async () =>
        typeof window !== "undefined" ? useAuthStore.getState().accessToken : null,
});

export const api = salesApi(client);
export type { SalesOrder, Customer } from "@erp/shared";
