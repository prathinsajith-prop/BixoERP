import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  WEBHOOK_SUBSCRIPTION_REPOSITORY,
  WebhookSubscriptionRepository,
} from '../../domain/repositories/webhook-subscription.repository';
import {
  INTEGRATION_LOG_REPOSITORY,
  IntegrationLogRepository,
} from '../../domain/repositories/integration-log.repository';
import { DeliverWebhookUseCase } from './deliver-webhook.use-case';
import { IntegrationStatus } from '../../domain/value-objects/integration-status.vo';
import { MaxRetriesExceededException } from '../../domain/exceptions/domain.exceptions';

@Injectable()
export class RetryFailedDeliveryUseCase {
  private readonly logger = new Logger(RetryFailedDeliveryUseCase.name);
  private readonly maxRetries: number;
  private readonly initialDelayMs: number;

  constructor(
    @Inject(WEBHOOK_SUBSCRIPTION_REPOSITORY) private readonly subscriptionRepo: WebhookSubscriptionRepository,
    @Inject(INTEGRATION_LOG_REPOSITORY) private readonly logRepo: IntegrationLogRepository,
    private readonly deliverWebhookUseCase: DeliverWebhookUseCase,
    config: ConfigService,
  ) {
    this.maxRetries = config.get<number>('webhook.maxRetries') || 5;
    this.initialDelayMs = config.get<number>('webhook.initialDelayMs') || 1000;
  }

  async execute(logId: string, tenantId: string): Promise<void> {
    const failedLog = await this.logRepo.findById(logId, tenantId);
    if (!failedLog) {
      this.logger.warn(`Integration log not found: ${logId}`);
      return;
    }

    if (failedLog.status !== IntegrationStatus.FAILED) {
      this.logger.debug(`Log ${logId} is not in FAILED state, skipping retry`);
      return;
    }

    const attempt = failedLog.attempt + 1;
    if (attempt > this.maxRetries) {
      throw new MaxRetriesExceededException(failedLog.subscriptionId || logId, this.maxRetries);
    }

    if (!failedLog.subscriptionId) {
      this.logger.warn(`No subscription associated with log ${logId}`);
      return;
    }

    const subscription = await this.subscriptionRepo.findById(failedLog.subscriptionId, tenantId);
    if (!subscription) {
      this.logger.warn(`Subscription not found: ${failedLog.subscriptionId}`);
      return;
    }

    // Exponential backoff delay
    const delayMs = this.initialDelayMs * Math.pow(2, attempt - 2);
    this.logger.log(`Retrying delivery for log ${logId}, attempt ${attempt}, delay ${delayMs}ms`);

    failedLog.markRetrying();
    await this.logRepo.save(failedLog);

    await new Promise((resolve) => setTimeout(resolve, delayMs));

    await this.deliverWebhookUseCase.deliverToSubscriber(
      subscription,
      {
        eventType: failedLog.eventType,
        tenantId: failedLog.tenantId,
        payload: (failedLog.requestBody as Record<string, unknown>)?.payload as Record<string, unknown> || {},
        eventId: (failedLog.requestBody as Record<string, unknown>)?.eventId as string || failedLog.id,
      },
      attempt,
    );
  }

  async retryAllFailed(tenantId: string, subscriptionId: string): Promise<{ retried: number; skipped: number }> {
    const failedLogs = await this.logRepo.findFailedBySubscription(subscriptionId, tenantId);
    let retried = 0;
    let skipped = 0;

    for (const log of failedLogs) {
      try {
        if (log.attempt >= this.maxRetries) {
          skipped++;
          continue;
        }
        await this.execute(log.id, tenantId);
        retried++;
      } catch {
        skipped++;
      }
    }

    this.logger.log(`Retry batch for subscription ${subscriptionId}: retried=${retried}, skipped=${skipped}`);
    return { retried, skipped };
  }
}
