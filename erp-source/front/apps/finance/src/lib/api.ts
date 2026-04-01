import { ApiClient, financeApi } from "@erp/api-client";
import { useAuthStore } from "@erp/shell";

const client = new ApiClient({
    baseUrl: typeof window !== "undefined" ? window.location.origin : "",
    getToken: async () =>
        typeof window !== "undefined" ? useAuthStore.getState().accessToken : null,
});

export const api = financeApi(client);
export type { Account, JournalEntry, FiscalPeriod, Budget } from "@erp/shared";
