import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Consumer, EachMessagePayload, logLevel } from 'kafkajs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProcessedEventOrmEntity } from '../../database/entities/processed-event.orm-entity';
import { v4 as uuidv4 } from 'uuid';

export interface EventHandler {
  eventType: string;
  handle(payload: Record<string, unknown>, tenantId: string): Promise<void>;
}

@Injectable()
export class KafkaEventConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaEventConsumer.name);
  private consumer!: Consumer;
  private kafka!: Kafka;
  private handlers: Map<string, EventHandler> = new Map();

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(ProcessedEventOrmEntity)
    private readonly processedRepo: Repository<ProcessedEventOrmEntity>,
  ) {}

  registerHandler(handler: EventHandler): void {
    this.handlers.set(handler.eventType, handler);
  }

  async onModuleInit(): Promise<void> {
    this.kafka = new Kafka({
      clientId: this.config.get<string>('kafka.clientId'),
      brokers: this.config.get<string[]>('kafka.brokers')!,
      logLevel: logLevel.WARN,
    });
    this.consumer = this.kafka.consumer({
      groupId: this.config.get<string>('kafka.groupId')!,
    });
    await this.consumer.connect();

    // Subscribe to topics for registered handlers
    const topics = [...this.handlers.keys()].map((t) => t.replace(/\./g, '-'));
    for (const topic of topics) {
      await this.consumer.subscribe({ topic, fromBeginning: false });
    }

    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        await this.handleMessage(payload);
      },
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.consumer.disconnect();
  }

  private async handleMessage(messagePayload: EachMessagePayload): Promise<void> {
    const { message } = messagePayload;
    if (!message.value) return;

    try {
      const event = JSON.parse(message.value.toString());
      const eventType = event.eventType;
      const eventId = event.eventId;
      const tenantId = event.tenantId;

      // Idempotency check: skip if already processed
      const alreadyProcessed = await this.processedRepo.count({
        where: { eventId, tenantId },
      });
      if (alreadyProcessed > 0) {
        this.logger.debug(`Skipping duplicate event: ${eventId}`);
        return;
      }

      const handler = this.handlers.get(eventType);
      if (handler) {
        await handler.handle(event.payload, tenantId);
      }

      // Mark as processed (idempotency)
      const processed = new ProcessedEventOrmEntity();
      processed.id = uuidv4();
      processed.eventId = eventId;
      processed.eventType = eventType;
      processed.tenantId = tenantId;
      await this.processedRepo.save(processed);
    } catch (error) {
      this.logger.error(`Error processing message: ${error}`);
    }
  }
}
