export const EVENT_PUBLISHER = Symbol('EVENT_PUBLISHER');

export interface EventPublisher {
  publish(topic: string, event: Record<string, unknown>): Promise<void>;
}
