import { WebhookSubscription } from '../entities/webhook-subscription.entity';

export interface WebhookSubscriptionRepository {
  save(subscription: WebhookSubscription): Promise<void>;
  findById(id: string, tenantId: string): Promise<WebhookSubscription | null>;
  findByTenant(tenantId: string, options?: {
    limit?: number;
    offset?: number;
    status?: string;
  }): Promise<WebhookSubscription[]>;
  findActiveByEvent(tenantId: string, eventType: string): Promise<WebhookSubscription[]>;
  findAllActiveByEvent(eventType: string): Promise<WebhookSubscription[]>;
  delete(id: string, tenantId: string): Promise<void>;
}

export const WEBHOOK_SUBSCRIPTION_REPOSITORY = Symbol('WebhookSubscriptionRepository');
