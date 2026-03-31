import { ApiClient } from "../client";
import type { BillOfMaterials, WorkOrder } from "@erp/shared";

export const manufacturingApi = (client: ApiClient) => ({
  bom: {
    list: (params?: Record<string, string | number | boolean | undefined>) =>
      client.list<BillOfMaterials>("/api/v1/manufacturing/bom", params),
    get: (id: string) => client.get<BillOfMaterials>(`/api/v1/manufacturing/bom/${id}`),
    create: (data: Partial<BillOfMaterials>) => client.post<BillOfMaterials>("/api/v1/manufacturing/bom", data),
    update: (id: string, data: Partial<BillOfMaterials>) => client.put<BillOfMaterials>(`/api/v1/manufacturing/bom/${id}`, data),
  },
  workOrders: {
    list: (params?: Record<string, string | number | boolean | undefined>) =>
      client.list<WorkOrder>("/api/v1/manufacturing/work-orders", params),
    get: (id: string) => client.get<WorkOrder>(`/api/v1/manufacturing/work-orders/${id}`),
    create: (data: Partial<WorkOrder>) => client.post<WorkOrder>("/api/v1/manufacturing/work-orders", data),
    update: (id: string, data: Partial<WorkOrder>) => client.put<WorkOrder>(`/api/v1/manufacturing/work-orders/${id}`, data),
  },
});
