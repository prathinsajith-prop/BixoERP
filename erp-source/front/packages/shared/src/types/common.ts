// ─── Common / Shared Types ──────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
}

export type Currency = string; // ISO 4217

export interface Money {
  amount: number;
  currency: Currency;
}

export interface AuditFields {
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}
