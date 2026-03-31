import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, logLevel } from 'kafkajs';
import { DomainEvent } from '../../../domain/entities/aggregate-root.base';
import { EventPublisher } from '../../../application/ports/event-publisher.port';

@Injectable()
export class KafkaEventPublisher implements EventPublisher, OnModuleInit, OnModuleDestroy {
  private producer!: Producer;
  private kafka!: Kafka;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    this.kafka = new Kafka({
      clientId: this.config.get<string>('kafka.clientId'),
      brokers: this.config.get<string[]>('kafka.brokers')!,
      logLevel: logLevel.WARN,
    });
    this.producer = this.kafka.producer();
    await this.producer.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.producer.disconnect();
  }

  async publish(event: DomainEvent): Promise<void> {
    await this.producer.send({
      topic: event.eventType.replace(/\./g, '-'),
      messages: [
        {
          key: `${event.tenantId}:${event.aggregateId}`,
          value: JSON.stringify({
            eventId: event.eventId,
            eventType: event.eventType,
            aggregateId: event.aggregateId,
            tenantId: event.tenantId,
            occurredAt: event.occurredAt.toISOString(),
            payload: event.payload,
          }),
          headers: {
            'event-type': event.eventType,
            'tenant-id': event.tenantId,
          },
        },
      ],
    });
  }

  async publishMany(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }
}
