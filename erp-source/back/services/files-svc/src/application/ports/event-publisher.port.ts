import { DomainEvent } from '../../domain/entities/aggregate-root.base';

export interface EventPublisher {
  publish(event: DomainEvent): Promise<void>;
  publishMany(events: DomainEvent[]): Promise<void>;
}

export const EVENT_PUBLISHER = Symbol('EventPublisher');
