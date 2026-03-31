import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OutboxEventOrmEntity } from '../database/entities/outbox-event.orm-entity';
import { KafkaEventPublisher } from '../kafka/producers/kafka-event-publisher';

@Injectable()
export class OutboxRelay {
  private readonly logger = new Logger(OutboxRelay.name);

  constructor(
    @InjectRepository(OutboxEventOrmEntity)
    private readonly outboxRepo: Repository<OutboxEventOrmEntity>,
    private readonly kafkaPublisher: KafkaEventPublisher,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async relayPendingEvents(): Promise<void> {
    const pending = await this.outboxRepo.find({
      where: { processed: false },
      order: { createdAt: 'ASC' },
      take: 100,
    });

    for (const event of pending) {
      try {
        await this.kafkaPublisher.publish({
          eventId: event.eventId,
          eventType: event.eventType,
          aggregateId: event.aggregateId,
          tenantId: event.tenantId,
          occurredAt: event.createdAt,
          payload: event.payload,
        });

        event.processed = true;
        event.processedAt = new Date();
        await this.outboxRepo.save(event);
      } catch (error) {
        this.logger.error(`Failed to relay outbox event ${event.id}: ${error}`);
      }
    }
  }
}
