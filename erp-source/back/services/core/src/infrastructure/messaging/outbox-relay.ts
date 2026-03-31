import { Injectable, Logger } from '@nestjs/common';
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
    });
    this.producer = kafka.producer();
  }

  async onModuleInit(): Promise<void> {
    await this.producer.connect();
    this.logger.log('Outbox relay Kafka producer connected');
  }

  async onModuleDestroy(): Promise<void> {
    await this.producer.disconnect();
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async relayEvents(): Promise<void> {
    const events = await this.outboxRepo.find({
      where: { published: false },
      order: { created_at: 'ASC' },
      take: 100,
    });

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

import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
