import { randomUUID } from 'crypto';

export abstract class Entity {
  readonly id: string;
  readonly tenantId: string;
  readonly createdAt: Date;
  updatedAt: Date;

  protected constructor(tenantId: string, id?: string) {
    this.id = id ?? randomUUID();
    this.tenantId = tenantId;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}

export abstract class AggregateRoot extends Entity {
  private readonly _domainEvents: DomainEvent[] = [];

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents.length = 0;
    return events;
  }
}

export interface DomainEvent {
  eventType: string;
  aggregateId: string;
  tenantId: string;
  occurredAt: Date;
  payload: Record<string, unknown>;
}
