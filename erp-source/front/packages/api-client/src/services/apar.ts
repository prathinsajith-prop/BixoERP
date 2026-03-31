import { ApiClient } from "../client";
import type { Invoice, Payment } from "@erp/shared";

export const aparApi = (client: ApiClient) => ({
  invoices: {
    list: (params?: Record<string, string | number | boolean | undefined>) =>
      client.list<Invoice>("/api/v1/apar/invoices", params),
    get: (id: string) => client.get<Invoice>(`/api/v1/apar/invoices/${id}`),
    create: (data: Partial<Invoice>) => client.post<Invoice>("/api/v1/apar/invoices", data),
    update: (id: string, data: Partial<Invoice>) => client.put<Invoice>(`/api/v1/apar/invoices/${id}`, data),
    void: (id: string) => client.post(`/api/v1/apar/invoices/${id}/void`),
  },
  payments: {
    list: (params?: Record<string, string | number | boolean | undefined>) =>
      client.list<Payment>("/api/v1/apar/payments", params),
    get: (id: string) => client.get<Payment>(`/api/v1/apar/payments/${id}`),
    create: (data: Partial<Payment>) => client.post<Payment>("/api/v1/apar/payments", data),
  },
});
