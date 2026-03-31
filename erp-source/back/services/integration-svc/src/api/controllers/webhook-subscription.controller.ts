import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  Inject,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { TenantId, CurrentUser } from '../decorators/tenant.decorator';
import { ZodValidationPipe } from '../middleware/zod-validation.pipe';
import {
  RegisterWebhookSchema,
  UpdateWebhookSchema,
  ListWebhooksSchema,
  TestWebhookSchema,
  RegisterWebhookDto,
  UpdateWebhookDto,
  ListWebhooksDto,
  TestWebhookDto,
} from '../dto/webhook.schemas';
import {
  WEBHOOK_SUBSCRIPTION_REPOSITORY,
  WebhookSubscriptionRepository,
} from '../../domain/repositories/webhook-subscription.repository';
import { RegisterWebhookUseCase } from '../../application/use-cases/register-webhook.use-case';
import { DeliverWebhookUseCase } from '../../application/use-cases/deliver-webhook.use-case';
import { RetryFailedDeliveryUseCase } from '../../application/use-cases/retry-failed-delivery.use-case';
import { EntityNotFoundException } from '../../domain/exceptions/domain.exceptions';
import { CACHE_PORT, CachePort } from '../../application/ports/cache.port';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('Webhook Subscriptions')
@ApiBearerAuth()
@Controller('api/v1/integrations/webhooks')
export class WebhookSubscriptionController {
  constructor(
    @Inject(WEBHOOK_SUBSCRIPTION_REPOSITORY) private readonly repo: WebhookSubscriptionRepository,
    @Inject(CACHE_PORT) private readonly cache: CachePort,
    private readonly registerWebhookUseCase: RegisterWebhookUseCase,
    private readonly deliverWebhookUseCase: DeliverWebhookUseCase,
    private readonly retryFailedDeliveryUseCase: RetryFailedDeliveryUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new webhook subscription' })
  async register(
    @TenantId() tenantId: string,
    @CurrentUser() user: { userId: string },
    @Body(new ZodValidationPipe(RegisterWebhookSchema)) body: RegisterWebhookDto,
  ) {
    const subscription = await this.registerWebhookUseCase.execute({
      tenantId,
      url: body.url,
      events: body.events,
      secret: body.secret,
      description: body.description,
      headers: body.headers,
      createdBy: user.userId,
    });

    await this.cache.delByPattern(`webhooks:${tenantId}:*`);

    return {
      data: {
        id: subscription.id,
        url: subscription.url,
        events: subscription.events,
        status: subscription.status,
        description: subscription.description,
        createdAt: subscription.createdAt.toISOString(),
      },
    };
  }

  @Get()
  @ApiOperation({ summary: 'List webhook subscriptions' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'] })
  async list(
    @TenantId() tenantId: string,
    @Query(new ZodValidationPipe(ListWebhooksSchema)) query: ListWebhooksDto,
  ) {
    const subscriptions = await this.repo.findByTenant(tenantId, {
      limit: query.limit,
      offset: query.offset,
      status: query.status,
    });

    return {
      data: subscriptions.map((s) => ({
        id: s.id,
        url: s.url,
        events: s.events,
        status: s.status,
        description: s.description,
        failureCount: s.failureCount,
        lastDeliveredAt: s.lastDeliveredAt?.toISOString(),
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      })),
      meta: { limit: query.limit, offset: query.offset },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get webhook subscription by ID' })
  @ApiParam({ name: 'id', type: String })
  async findById(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    const subscription = await this.repo.findById(id, tenantId);
    if (!subscription) {
      throw new EntityNotFoundException('WebhookSubscription', id);
    }

    return {
      data: {
        id: subscription.id,
        url: subscription.url,
        events: subscription.events,
        status: subscription.status,
        description: subscription.description,
        headers: subscription.headers,
        failureCount: subscription.failureCount,
        lastDeliveredAt: subscription.lastDeliveredAt?.toISOString(),
        createdBy: subscription.createdBy,
        createdAt: subscription.createdAt.toISOString(),
        updatedAt: subscription.updatedAt.toISOString(),
      },
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update webhook subscription' })
  @ApiParam({ name: 'id', type: String })
  async update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateWebhookSchema)) body: UpdateWebhookDto,
  ) {
    const subscription = await this.repo.findById(id, tenantId);
    if (!subscription) {
      throw new EntityNotFoundException('WebhookSubscription', id);
    }

    subscription.updateConfig({
      url: body.url,
      events: body.events,
      description: body.description,
      headers: body.headers,
    });

    await this.repo.save(subscription);
    await this.cache.delByPattern(`webhooks:${tenantId}:*`);

    return {
      data: {
        id: subscription.id,
        url: subscription.url,
        events: subscription.events,
        status: subscription.status,
        description: subscription.description,
        updatedAt: subscription.updatedAt.toISOString(),
      },
    };
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a webhook subscription' })
  @ApiParam({ name: 'id', type: String })
  async deactivate(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    const subscription = await this.repo.findById(id, tenantId);
    if (!subscription) {
      throw new EntityNotFoundException('WebhookSubscription', id);
    }

    subscription.deactivate();
    await this.repo.save(subscription);
    await this.cache.delByPattern(`webhooks:${tenantId}:*`);

    return { success: true, status: subscription.status };
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Re-activate a webhook subscription' })
  @ApiParam({ name: 'id', type: String })
  async activate(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    const subscription = await this.repo.findById(id, tenantId);
    if (!subscription) {
      throw new EntityNotFoundException('WebhookSubscription', id);
    }

    subscription.activate();
    await this.repo.save(subscription);
    await this.cache.delByPattern(`webhooks:${tenantId}:*`);

    return { success: true, status: subscription.status };
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Send a test webhook delivery' })
  @ApiParam({ name: 'id', type: String })
  async test(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(TestWebhookSchema)) body: TestWebhookDto,
  ) {
    const subscription = await this.repo.findById(id, tenantId);
    if (!subscription) {
      throw new EntityNotFoundException('WebhookSubscription', id);
    }

    await this.deliverWebhookUseCase.deliverToSubscriber(subscription, {
      eventType: body.eventType,
      tenantId,
      payload: body.payload || { test: true, timestamp: new Date().toISOString() },
      eventId: uuidv4(),
    });

    return { success: true, message: 'Test webhook delivered' };
  }

  @Post(':id/retry')
  @ApiOperation({ summary: 'Retry all failed deliveries for a subscription' })
  @ApiParam({ name: 'id', type: String })
  async retryFailed(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    const subscription = await this.repo.findById(id, tenantId);
    if (!subscription) {
      throw new EntityNotFoundException('WebhookSubscription', id);
    }

    const result = await this.retryFailedDeliveryUseCase.retryAllFailed(tenantId, id);
    return { success: true, ...result };
  }
}
