import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';
import { OutboxEventOrmEntity } from '../persistence/entity/outbox.orm-entity';

@Injectable()
export class OutboxRelay implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxRelay.name);
  private producer: Producer;

  constructor(
    @InjectRepository(OutboxEventOrmEntity)
    private readonly outboxRepo: Repository<OutboxEventOrmEntity>,
    private readonly config: ConfigService,
  ) {
    const kafka = new Kafka({
      clientId: `${this.config.get<string>('kafka.clientId')}-outbox`,
      brokers: this.config.get<string[]>('kafka.brokers')!,
      retry: { retries: 3 },
    });
    this.producer = kafka.producer();
  }

  private available = false;

  async onModuleInit(): Promise<void> {
    try {
      await this.producer.connect();
      this.available = true;
      this.logger.log('Outbox relay Kafka producer connected');
    } catch (err) {
      this.logger.warn(`Outbox relay Kafka unavailable: ${(err as Error).message}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.available) {
      try { await this.producer.disconnect(); } catch { /* ignore */ }
    }
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async relayEvents(): Promise<void> {
    if (!this.available) return;
    let events: OutboxEventOrmEntity[];
    try {
      events = await this.outboxRepo.find({
        where: { published: false },
        order: { created_at: 'ASC' },
        take: 100,
      });
    } catch (err) {
      this.logger.warn(`Outbox DB query failed: ${(err as Error).message}`);
      return;
    }

    for (const event of events) {
      try {
        await this.producer.send({
          topic: event.topic,
          messages: [
            {
              key: String(event.payload.aggregateId ?? event.id),
              value: JSON.stringify(event.payload),
            },
          ],
        });
        event.published = true;
        await this.outboxRepo.save(event);
      } catch (err) {
        this.logger.error(`Failed to relay outbox event ${event.id}`, (err as Error).stack);
        break;
      }
    }
  }
}
