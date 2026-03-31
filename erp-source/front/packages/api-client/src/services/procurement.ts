import { ApiClient } from "../client";
import type { PurchaseOrder, Vendor } from "@erp/shared";

export const procurementApi = (client: ApiClient) => ({
  orders: {
    list: (params?: Record<string, string | number | boolean | undefined>) =>
      client.list<PurchaseOrder>("/api/v1/procurement/orders", params),
    get: (id: string) => client.get<PurchaseOrder>(`/api/v1/procurement/orders/${id}`),
    create: (data: Partial<PurchaseOrder>) => client.post<PurchaseOrder>("/api/v1/procurement/orders", data),
    update: (id: string, data: Partial<PurchaseOrder>) => client.put<PurchaseOrder>(`/api/v1/procurement/orders/${id}`, data),
    approve: (id: string) => client.post(`/api/v1/procurement/orders/${id}/approve`),
  },
  vendors: {
    list: (params?: Record<string, string | number | boolean | undefined>) =>
      client.list<Vendor>("/api/v1/procurement/vendors", params),
    get: (id: string) => client.get<Vendor>(`/api/v1/procurement/vendors/${id}`),
    create: (data: Partial<Vendor>) => client.post<Vendor>("/api/v1/procurement/vendors", data),
    update: (id: string, data: Partial<Vendor>) => client.put<Vendor>(`/api/v1/procurement/vendors/${id}`, data),
  },
});
