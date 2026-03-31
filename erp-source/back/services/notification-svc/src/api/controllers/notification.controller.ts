import { Controller, Get, Patch, Post, Body, Param, Query, Inject, UsePipes } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { TenantId, CurrentUser } from '../decorators/tenant.decorator';
import { ZodValidationPipe } from '../middleware/zod-validation.pipe';
import {
  ListNotificationsSchema,
  MarkBatchAsReadSchema,
  ListNotificationsDto,
  MarkBatchAsReadDto,
} from '../dto/notification.schemas';
import { NOTIFICATION_REPOSITORY, NotificationRepository } from '../../domain/repositories/notification.repository';
import { MarkAsReadUseCase } from '../../application/use-cases/mark-as-read.use-case';
import { CACHE_PORT, CachePort } from '../../application/ports/cache.port';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('api/v1/notifications')
export class NotificationController {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY) private readonly notificationRepo: NotificationRepository,
    @Inject(CACHE_PORT) private readonly cache: CachePort,
    private readonly markAsReadUseCase: MarkAsReadUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List notifications for the current user' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  async list(
    @TenantId() tenantId: string,
    @CurrentUser() user: { userId: string },
    @Query(new ZodValidationPipe(ListNotificationsSchema)) query: ListNotificationsDto,
  ) {
    const notifications = await this.notificationRepo.findByRecipient(tenantId, user.userId, {
      limit: query.limit,
      offset: query.offset,
      unreadOnly: query.unreadOnly,
    });

    return {
      data: notifications.map((n) => ({
        id: n.id,
        channel: n.channel,
        subject: n.subject,
        body: n.body,
        status: n.status,
        metadata: n.metadata,
        sentAt: n.sentAt?.toISOString(),
        readAt: n.readAt?.toISOString(),
        createdAt: n.createdAt.toISOString(),
      })),
      meta: { limit: query.limit, offset: query.offset },
    };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count for the current user' })
  async unreadCount(
    @TenantId() tenantId: string,
    @CurrentUser() user: { userId: string },
  ) {
    const cacheKey = `unread:${tenantId}:${user.userId}`;
    const cached = await this.cache.get<number>(cacheKey);
    if (cached !== null) return { count: cached };

    const count = await this.notificationRepo.countUnread(tenantId, user.userId);
    await this.cache.set(cacheKey, count, 60);
    return { count };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a single notification as read' })
  @ApiParam({ name: 'id', type: String })
  async markAsRead(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    await this.markAsReadUseCase.execute(id, tenantId);
    await this.cache.del(`unread:${tenantId}:${user.userId}`);
    return { success: true };
  }

  @Post('read-batch')
  @ApiOperation({ summary: 'Mark multiple notifications as read' })
  async markBatchAsRead(
    @TenantId() tenantId: string,
    @CurrentUser() user: { userId: string },
    @Body(new ZodValidationPipe(MarkBatchAsReadSchema)) body: MarkBatchAsReadDto,
  ) {
    await this.markAsReadUseCase.executeBatch(body.ids, tenantId);
    await this.cache.del(`unread:${tenantId}:${user.userId}`);
    return { success: true, count: body.ids.length };
  }
}
