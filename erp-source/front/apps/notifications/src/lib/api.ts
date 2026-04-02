import { ApiClient, notificationsApi } from "@erp/api-client";
import { useAuthStore } from "@erp/shell";

const client = new ApiClient({
    baseUrl: typeof window !== "undefined" ? window.location.origin : "",
    getToken: async () =>
        typeof window !== "undefined" ? useAuthStore.getState().accessToken : null,
});

export const api = notificationsApi(client);
export type { Notification } from "@erp/shared";
