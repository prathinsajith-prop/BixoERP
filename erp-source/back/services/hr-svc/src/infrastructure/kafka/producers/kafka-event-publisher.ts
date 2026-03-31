import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, logLevel } from 'kafkajs';
import { DomainEvent } from '../../../domain/entities/aggregate-root.base';
import { EventPublisher } from '../../../application/ports/event-publisher.port';

@Injectable()
export class KafkaEventPublisher implements EventPublisher, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaEventPublisher.name);
  private producer!: Producer;
  private kafka!: Kafka;
  private connected = false;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    try {
      this.kafka = new Kafka({
        clientId: this.config.get<string>('kafka.clientId'),
        brokers: this.config.get<string[]>('kafka.brokers')!,
        logLevel: logLevel.WARN,
        retry: { retries: 3 },
      });
      this.producer = this.kafka.producer();
      await this.producer.connect();
      this.connected = true;
    } catch (error) {
      this.logger.warn(`Kafka producer connection failed, events will not be published: ${error}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.producer.disconnect();
  }

  async publish(event: DomainEvent): Promise<void> {
    if (!this.connected) {
      this.logger.warn(`Kafka not connected, skipping event: ${event.eventType}`);
      return;
    }
    await this.producer.send({
      topic: event.eventType.replace(/\./g, '-'), // e.g. employee-hired
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
