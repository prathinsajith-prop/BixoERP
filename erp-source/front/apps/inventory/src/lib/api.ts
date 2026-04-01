import { ApiClient, inventoryApi } from "@erp/api-client";
import { useAuthStore } from "@erp/shell";

const client = new ApiClient({
    baseUrl: typeof window !== "undefined" ? window.location.origin : "",
    getToken: async () =>
        typeof window !== "undefined" ? useAuthStore.getState().accessToken : null,
});

export const api = inventoryApi(client);
export type { InventoryItem, Warehouse, StockLevel, StockMovement } from "@erp/shared";
