import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  WEBHOOK_SUBSCRIPTION_REPOSITORY,
  WebhookSubscriptionRepository,
} from '../../domain/repositories/webhook-subscription.repository';
import { EVENT_PUBLISHER, EventPublisher } from '../ports/event-publisher.port';
import { WebhookSubscription } from '../../domain/entities/webhook-subscription.entity';
import { RegisterWebhookDto } from '../dtos/register-webhook.dto';
import { DuplicateEntryException } from '../../domain/exceptions/domain.exceptions';

@Injectable()
export class RegisterWebhookUseCase {
  private readonly logger = new Logger(RegisterWebhookUseCase.name);

  constructor(
    @Inject(WEBHOOK_SUBSCRIPTION_REPOSITORY) private readonly repo: WebhookSubscriptionRepository,
    @Inject(EVENT_PUBLISHER) private readonly publisher: EventPublisher,
  ) {}

  async execute(dto: RegisterWebhookDto): Promise<WebhookSubscription> {
    // Check for duplicate URL + events for this tenant
    const existing = await this.repo.findByTenant(dto.tenantId);
    const duplicate = existing.find(
      (s) => s.url === dto.url && JSON.stringify(s.events.sort()) === JSON.stringify(dto.events.sort()),
    );
    if (duplicate) {
      throw new DuplicateEntryException('webhook_subscription', `${dto.url} subscribing to [${dto.events.join(', ')}]`);
    }

    const subscription = WebhookSubscription.create({
      tenantId: dto.tenantId,
      url: dto.url,
      events: dto.events,
      secret: dto.secret,
      description: dto.description,
      headers: dto.headers,
      createdBy: dto.createdBy,
    });

    await this.repo.save(subscription);

    const domainEvents = subscription.clearDomainEvents();
    await this.publisher.publishMany(domainEvents);

    this.logger.log(`Webhook registered: ${subscription.id} → ${dto.url} for events [${dto.events.join(', ')}]`);
    return subscription;
  }
}
