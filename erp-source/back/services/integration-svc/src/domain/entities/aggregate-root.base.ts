export abstract class AggregateRoot<T> {
  protected readonly _id: string;
  protected props: T;
  private _domainEvents: DomainEvent[] = [];

  constructor(props: T, id: string) {
    this._id = id;
    this.props = props;
  }

  get id(): string {
    return this._id;
  }

  get domainEvents(): ReadonlyArray<DomainEvent> {
    return this._domainEvents;
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  clearDomainEvents(): DomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }

  equals(other: AggregateRoot<T>): boolean {
    return this._id === other._id;
  }
}

export interface DomainEvent {
  eventId: string;
  eventType: string;
  aggregateId: string;
  tenantId: string;
  occurredAt: Date;
  payload: Record<string, unknown>;
}
