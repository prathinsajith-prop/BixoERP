import { ApiClient } from "../client";
import type { SalesOrder, Customer } from "@erp/shared";

export const salesApi = (client: ApiClient) => ({
  orders: {
    list: (params?: Record<string, string | number | boolean | undefined>) =>
      client.list<SalesOrder>("/api/v1/sales/orders", params),
    get: (id: string) => client.get<SalesOrder>(`/api/v1/sales/orders/${id}`),
    create: (data: Partial<SalesOrder>) => client.post<SalesOrder>("/api/v1/sales/orders", data),
    update: (id: string, data: Partial<SalesOrder>) => client.put<SalesOrder>(`/api/v1/sales/orders/${id}`, data),
    confirm: (id: string) => client.post(`/api/v1/sales/orders/${id}/confirm`),
  },
  customers: {
    list: (params?: Record<string, string | number | boolean | undefined>) =>
      client.list<Customer>("/api/v1/sales/customers", params),
    get: (id: string) => client.get<Customer>(`/api/v1/sales/customers/${id}`),
    create: (data: Partial<Customer>) => client.post<Customer>("/api/v1/sales/customers", data),
    update: (id: string, data: Partial<Customer>) => client.put<Customer>(`/api/v1/sales/customers/${id}`, data),
  },
});
