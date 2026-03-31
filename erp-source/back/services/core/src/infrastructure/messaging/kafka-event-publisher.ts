import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';
import { EventPublisher } from '../../application/port/event-publisher.port';

@Injectable()
export class KafkaEventPublisher implements EventPublisher, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaEventPublisher.name);
  private producer: Producer;

  constructor(private readonly config: ConfigService) {
    const kafka = new Kafka({
      clientId: this.config.get<string>('kafka.clientId'),
      brokers: this.config.get<string[]>('kafka.brokers')!,
    });
    this.producer = kafka.producer();
  }

  async onModuleInit(): Promise<void> {
    await this.producer.connect();
    this.logger.log('Kafka producer connected');
  }

  async onModuleDestroy(): Promise<void> {
    await this.producer.disconnect();
  }

  async publish(topic: string, event: Record<string, unknown>): Promise<void> {
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
  }
}
