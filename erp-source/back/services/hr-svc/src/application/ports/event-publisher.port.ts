import { DomainEvent } from '../../domain/entities/aggregate-root.base';

/** Port for publishing events (Kafka) — implemented in infrastructure */
export interface EventPublisher {
  publish(event: DomainEvent): Promise<void>;
  publishMany(events: DomainEvent[]): Promise<void>;
}

export const EVENT_PUBLISHER = Symbol('EventPublisher');
