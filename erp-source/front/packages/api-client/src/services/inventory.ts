import { ApiClient } from "../client";
import type { InventoryItem, Warehouse, StockLevel, StockMovement } from "@erp/shared";

export const inventoryApi = (client: ApiClient) => ({
  items: {
    list: (params?: Record<string, string | number | boolean | undefined>) =>
      client.list<InventoryItem>("/api/v1/inventory/items", params),
    get: (id: string) => client.get<InventoryItem>(`/api/v1/inventory/items/${id}`),
    create: (data: Partial<InventoryItem>) => client.post<InventoryItem>("/api/v1/inventory/items", data),
    update: (id: string, data: Partial<InventoryItem>) => client.put<InventoryItem>(`/api/v1/inventory/items/${id}`, data),
  },
  warehouses: {
    list: () => client.list<Warehouse>("/api/v1/inventory/warehouses"),
    get: (id: string) => client.get<Warehouse>(`/api/v1/inventory/warehouses/${id}`),
    create: (data: Partial<Warehouse>) => client.post<Warehouse>("/api/v1/inventory/warehouses", data),
  },
  stock: {
    levels: (params?: Record<string, string | number | boolean | undefined>) =>
      client.list<StockLevel>("/api/v1/inventory/stock", params),
    belowReorder: () => client.get<StockLevel[]>("/api/v1/inventory/stock/below-reorder"),
  },
  movements: {
    list: (params?: Record<string, string | number | boolean | undefined>) =>
      client.list<StockMovement>("/api/v1/inventory/movements", params),
    create: (data: Partial<StockMovement>) => client.post<StockMovement>("/api/v1/inventory/movements", data),
  },
});
