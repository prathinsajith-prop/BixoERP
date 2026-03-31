import { Injectable, Inject, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  WEBHOOK_SUBSCRIPTION_REPOSITORY,
  WebhookSubscriptionRepository,
} from '../../domain/repositories/webhook-subscription.repository';
import {
  INTEGRATION_LOG_REPOSITORY,
  IntegrationLogRepository,
} from '../../domain/repositories/integration-log.repository';
import { HTTP_CLIENT, HttpClient } from '../ports/http-client.port';
import { IntegrationLog } from '../../domain/entities/integration-log.entity';
import { DeliverWebhookDto } from '../dtos/deliver-webhook.dto';
import { WebhookSubscription } from '../../domain/entities/webhook-subscription.entity';

@Injectable()
export class DeliverWebhookUseCase {
  private readonly logger = new Logger(DeliverWebhookUseCase.name);

  constructor(
    @Inject(WEBHOOK_SUBSCRIPTION_REPOSITORY) private readonly subscriptionRepo: WebhookSubscriptionRepository,
    @Inject(INTEGRATION_LOG_REPOSITORY) private readonly logRepo: IntegrationLogRepository,
    @Inject(HTTP_CLIENT) private readonly httpClient: HttpClient,
  ) {}

  async execute(dto: DeliverWebhookDto): Promise<void> {
    const subscriptions = await this.subscriptionRepo.findAllActiveByEvent(dto.eventType);

    const matching = subscriptions.filter(
      (s) => s.isDeliverable() && s.isSubscribedToEvent(dto.eventType),
    );

    this.logger.log(`Delivering event "${dto.eventType}" to ${matching.length} subscriber(s)`);

    await Promise.allSettled(
      matching.map((sub) => this.deliverToSubscriber(sub, dto)),
    );
  }

  async deliverToSubscriber(
    subscription: WebhookSubscription,
    dto: DeliverWebhookDto,
    attempt = 1,
  ): Promise<void> {
    const body = {
      eventId: dto.eventId,
      eventType: dto.eventType,
      tenantId: dto.tenantId,
      timestamp: new Date().toISOString(),
      payload: dto.payload,
    };

    const bodyString = JSON.stringify(body);
    const signature = this.computeHmac(bodyString, subscription.secret);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-ERP-Signature': signature,
      'X-ERP-Event': dto.eventType,
      'X-ERP-Delivery-Id': dto.eventId,
      ...subscription.headers,
    };

    const log = IntegrationLog.create({
      tenantId: dto.tenantId,
      subscriptionId: subscription.id,
      eventType: dto.eventType,
      direction: 'OUTBOUND',
      url: subscription.url,
      method: 'POST',
      requestHeaders: this.sanitizeHeaders(headers),
      requestBody: body,
      attempt,
    });

    try {
      const response = await this.httpClient.request({
        url: subscription.url,
        method: 'POST',
        headers,
        body,
        timeoutMs: 10_000,
      });

      if (response.status >= 200 && response.status < 300) {
        log.recordSuccess({
          status: response.status,
          headers: response.headers,
          body: response.body,
          durationMs: response.durationMs,
        });
        subscription.recordDeliverySuccess();
      } else {
        log.recordFailure({
          status: response.status,
          headers: response.headers,
          body: response.body,
          durationMs: response.durationMs,
          errorMessage: `HTTP ${response.status}`,
        });
        subscription.recordDeliveryFailure();
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      log.recordFailure({ errorMessage: errMsg });
      subscription.recordDeliveryFailure();
      this.logger.warn(`Webhook delivery failed for ${subscription.id}: ${errMsg}`);
    }

    await this.logRepo.save(log);
    await this.subscriptionRepo.save(subscription);
  }

  private computeHmac(body: string, secret: string): string {
    return `sha256=${crypto.createHmac('sha256', secret).update(body, 'utf8').digest('hex')}`;
  }

  private sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
    const sanitized = { ...headers };
    // Don't persist the signature in logs
    delete sanitized['X-ERP-Signature'];
    return sanitized;
  }
}
