import { Injectable, Inject } from '@nestjs/common';
import { NOTIFICATION_REPOSITORY, NotificationRepository } from '../../domain/repositories/notification.repository';
import { EVENT_PUBLISHER, EventPublisher } from '../ports/event-publisher.port';
import { EntityNotFoundException } from '../../domain/exceptions/domain.exceptions';

@Injectable()
export class MarkAsReadUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY) private readonly notificationRepo: NotificationRepository,
    @Inject(EVENT_PUBLISHER) private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(notificationId: string, tenantId: string): Promise<void> {
    const notification = await this.notificationRepo.findById(notificationId, tenantId);
    if (!notification) {
      throw new EntityNotFoundException('Notification', notificationId);
    }

    notification.markRead();
    await this.notificationRepo.save(notification);

    const events = notification.clearDomainEvents();
    for (const event of events) {
      await this.eventPublisher.publish(event);
    }
  }

  async executeBatch(ids: string[], tenantId: string): Promise<void> {
    await this.notificationRepo.markManyAsRead(ids, tenantId);
  }
}
