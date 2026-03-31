import { IntegrationLog } from '../entities/integration-log.entity';

export interface IntegrationLogRepository {
  save(log: IntegrationLog): Promise<void>;
  findById(id: string, tenantId: string): Promise<IntegrationLog | null>;
  findByTenant(tenantId: string, options?: {
    limit?: number;
    offset?: number;
    subscriptionId?: string;
    eventType?: string;
    status?: string;
    direction?: string;
  }): Promise<IntegrationLog[]>;
  findFailedBySubscription(subscriptionId: string, tenantId: string): Promise<IntegrationLog[]>;
  countByTenant(tenantId: string, filters?: {
    subscriptionId?: string;
    eventType?: string;
    status?: string;
  }): Promise<number>;
}

export const INTEGRATION_LOG_REPOSITORY = Symbol('IntegrationLogRepository');
