export interface DomainEvent {
  readonly eventId: string;
  readonly eventType: string;
  readonly aggregateId: string;
  readonly tenantId: string;
  readonly occurredAt: Date;
  readonly payload: Record<string, unknown>;
}

export interface TenantContext {
  tenantId: string;
  userId: string;
  roles: string[];
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface OutboxEvent {
  eventId: string;
  eventType: string;
  aggregateId: string;
  tenantId: string;
  payload: Record<string, unknown>;
  processed: boolean;
  createdAt: Date;
}
