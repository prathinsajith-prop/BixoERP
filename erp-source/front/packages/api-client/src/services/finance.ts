import { ApiClient } from "../client";
import type { Account, JournalEntry, FiscalPeriod, Budget } from "@erp/shared";

export const financeApi = (client: ApiClient) => ({
  accounts: {
    list: (params?: Record<string, string | number | boolean | undefined>) =>
      client.list<Account>("/api/v1/finance/accounts", params),
    get: (id: string) => client.get<Account>(`/api/v1/finance/accounts/${id}`),
    create: (data: Partial<Account>) => client.post<Account>("/api/v1/finance/accounts", data),
    update: (id: string, data: Partial<Account>) => client.put<Account>(`/api/v1/finance/accounts/${id}`, data),
    delete: (id: string) => client.delete(`/api/v1/finance/accounts/${id}`),
  },
  journals: {
    list: (params?: Record<string, string | number | boolean | undefined>) =>
      client.list<JournalEntry>("/api/v1/finance/journals", params),
    get: (id: string) => client.get<JournalEntry>(`/api/v1/finance/journals/${id}`),
    create: (data: Partial<JournalEntry>) => client.post<JournalEntry>("/api/v1/finance/journals", data),
    post: (id: string) => client.post(`/api/v1/finance/journals/${id}/post`),
    reverse: (id: string) => client.post(`/api/v1/finance/journals/${id}/reverse`),
  },
  periods: {
    list: () => client.list<FiscalPeriod>("/api/v1/finance/periods"),
    close: (id: string, type: "soft" | "hard") => client.post(`/api/v1/finance/periods/${id}/close`, { type }),
  },
  budgets: {
    list: (params?: Record<string, string | number | boolean | undefined>) =>
      client.list<Budget>("/api/v1/finance/budgets", params),
    get: (id: string) => client.get<Budget>(`/api/v1/finance/budgets/${id}`),
    create: (data: Partial<Budget>) => client.post<Budget>("/api/v1/finance/budgets", data),
    update: (id: string, data: Partial<Budget>) => client.put<Budget>(`/api/v1/finance/budgets/${id}`, data),
  },
});
