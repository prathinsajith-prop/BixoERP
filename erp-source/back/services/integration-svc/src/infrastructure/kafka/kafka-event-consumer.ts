import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Kafka, Consumer, EachMessagePayload, logLevel } from 'kafkajs';
import { ProcessedEventModel, ProcessedEventDocument } from '../database/schemas/processed-event.schema';

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
    @InjectModel(ProcessedEventModel.name) private readonly processedModel: Model<ProcessedEventDocument>,
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

    const topics = [...this.handlers.keys()].map((t) => t.replace(/\./g, '-'));
    for (const topic of topics) {
      await this.consumer.subscribe({ topic, fromBeginning: false });
    }

    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        await this.handleMessage(payload);
      },
    });

    this.logger.log(`Kafka consumer started — subscribed to: ${topics.join(', ')}`);
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

      // Idempotency check
      const existing = await this.processedModel.findOne({ eventId, tenantId }).lean().exec();
      if (existing) {
        this.logger.debug(`Skipping duplicate event: ${eventId}`);
        return;
      }

      const handler = this.handlers.get(eventType);
      if (handler) {
        await handler.handle(event.payload, tenantId);

        // Record processed event
        await this.processedModel.create({
          eventId,
          tenantId,
          eventType,
          processedAt: new Date(),
        });

        this.logger.debug(`Processed event: ${eventType} (${eventId})`);
      } else {
        this.logger.warn(`No handler for event type: ${eventType}`);
      }
    } catch (error) {
      this.logger.error(`Error processing Kafka message: ${error}`);
    }
  }
}
