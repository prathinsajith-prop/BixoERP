import { ApiClient } from "../client";
import type { FileRecord } from "@erp/shared";

export const filesApi = (client: ApiClient) => ({
  list: (params?: Record<string, string | number | boolean | undefined>) =>
    client.list<FileRecord>("/api/v1/files", params),
  get: (id: string) => client.get<FileRecord>(`/api/v1/files/${id}`),
  delete: (id: string) => client.delete(`/api/v1/files/${id}`),
});
