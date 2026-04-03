import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';
import { EventPublisher } from '../../application/port/event-publisher.port';

@Injectable()
export class KafkaEventPublisher implements EventPublisher, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaEventPublisher.name);
  private producer: Producer;
  private available = false;

  constructor(private readonly config: ConfigService) {
    const kafka = new Kafka({
      clientId: this.config.get<string>('kafka.clientId'),
      brokers: this.config.get<string[]>('kafka.brokers')!,
      retry: { retries: 3 },
    });
    this.producer = kafka.producer();
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.producer.connect();
      this.available = true;
      this.logger.log('Kafka producer connected');
    } catch (err) {
      this.logger.warn(`Kafka unavailable — event publishing disabled: ${(err as Error).message}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.available) {
      try { await this.producer.disconnect(); } catch { /* ignore */ }
    }
  }

  async publish(topic: string, event: Record<string, unknown>): Promise<void> {
    if (!this.available) {
      this.logger.debug(`Kafka not available, dropping event for topic ${topic}`);
      return;
    }
    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: (event.aggregateId as string) ?? undefined,
            value: JSON.stringify(event),
            headers: {
              'event-type': String(event.eventType ?? ''),
              'tenant-id': String(event.tenantId ?? ''),
            },
          },
        ],
      });
    } catch (err) {
      this.logger.error(`Failed to publish event to ${topic}: ${(err as Error).message}`);
    }
  }
}
