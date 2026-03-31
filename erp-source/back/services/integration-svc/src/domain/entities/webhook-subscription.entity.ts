import { AggregateRoot, DomainEvent } from './aggregate-root.base';
import { WebhookStatus } from '../value-objects/webhook-status.vo';
import { InvalidWebhookTransition } from '../exceptions/domain.exceptions';
import { v4 as uuidv4 } from 'uuid';

export interface WebhookSubscriptionProps {
  tenantId: string;
  url: string;
  events: string[];
  secret: string;
  status: WebhookStatus;
  description?: string;
  headers?: Record<string, string>;
  failureCount: number;
  lastDeliveredAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class WebhookSubscription extends AggregateRoot<WebhookSubscriptionProps> {
  get tenantId(): string { return this.props.tenantId; }
  get url(): string { return this.props.url; }
  get events(): string[] { return this.props.events; }
  get secret(): string { return this.props.secret; }
  get status(): WebhookStatus { return this.props.status; }
  get description(): string | undefined { return this.props.description; }
  get headers(): Record<string, string> | undefined { return this.props.headers; }
  get failureCount(): number { return this.props.failureCount; }
  get lastDeliveredAt(): Date | undefined { return this.props.lastDeliveredAt; }
  get createdBy(): string { return this.props.createdBy; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  static create(params: {
    tenantId: string;
    url: string;
    events: string[];
    secret: string;
    description?: string;
    headers?: Record<string, string>;
    createdBy: string;
  }): WebhookSubscription {
    const id = uuidv4();
    const now = new Date();
    const subscription = new WebhookSubscription(
      {
        tenantId: params.tenantId,
        url: params.url,
        events: params.events,
        secret: params.secret,
        status: WebhookStatus.ACTIVE,
        description: params.description,
        headers: params.headers,
        failureCount: 0,
        createdBy: params.createdBy,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );

    subscription.addDomainEvent({
      eventId: uuidv4(),
      eventType: 'webhook.subscription.created',
      aggregateId: id,
      tenantId: params.tenantId,
      occurredAt: now,
      payload: { url: params.url, events: params.events },
    });

    return subscription;
  }

  static reconstitute(props: WebhookSubscriptionProps, id: string): WebhookSubscription {
    return new WebhookSubscription(props, id);
  }

  activate(): void {
    if (this.props.status === WebhookStatus.ACTIVE) return;
    this.props.status = WebhookStatus.ACTIVE;
    this.props.failureCount = 0;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    if (this.props.status === WebhookStatus.INACTIVE) return;
    this.props.status = WebhookStatus.INACTIVE;
    this.props.updatedAt = new Date();
    this.addDomainEvent({
      eventId: uuidv4(),
      eventType: 'webhook.subscription.deactivated',
      aggregateId: this.id,
      tenantId: this.tenantId,
      occurredAt: new Date(),
      payload: { url: this.props.url },
    });
  }

  suspend(): void {
    if (this.props.status === WebhookStatus.INACTIVE) {
      throw new InvalidWebhookTransition(WebhookStatus.INACTIVE, WebhookStatus.SUSPENDED);
    }
    this.props.status = WebhookStatus.SUSPENDED;
    this.props.updatedAt = new Date();
  }

  recordDeliverySuccess(): void {
    this.props.failureCount = 0;
    this.props.lastDeliveredAt = new Date();
    this.props.updatedAt = new Date();
    if (this.props.status === WebhookStatus.SUSPENDED) {
      this.props.status = WebhookStatus.ACTIVE;
    }
  }

  recordDeliveryFailure(): void {
    this.props.failureCount += 1;
    this.props.updatedAt = new Date();
    // Suspend after 10 consecutive failures
    if (this.props.failureCount >= 10) {
      this.props.status = WebhookStatus.SUSPENDED;
    }
  }

  updateConfig(params: {
    url?: string;
    events?: string[];
    description?: string;
    headers?: Record<string, string>;
  }): void {
    if (params.url) this.props.url = params.url;
    if (params.events) this.props.events = params.events;
    if (params.description !== undefined) this.props.description = params.description;
    if (params.headers !== undefined) this.props.headers = params.headers;
    this.props.updatedAt = new Date();
  }

  isSubscribedToEvent(eventType: string): boolean {
    return this.props.events.includes(eventType) || this.props.events.includes('*');
  }

  isDeliverable(): boolean {
    return this.props.status === WebhookStatus.ACTIVE;
  }
}
