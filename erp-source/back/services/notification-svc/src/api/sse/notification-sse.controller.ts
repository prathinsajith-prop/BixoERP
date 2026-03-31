import { Controller, Get, Sse, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { SseNotificationGateway } from './notification-sse.gateway';

@ApiTags('Notifications — Real-time')
@ApiBearerAuth()
@Controller('api/v1/notifications')
export class NotificationSseController {
  constructor(private readonly sseGateway: SseNotificationGateway) {}

  @Get('stream')
  @Sse()
  @ApiOperation({ summary: 'SSE stream for real-time notifications' })
  stream(@Req() req: Request): Observable<MessageEvent> {
    const user = (req as any).user;
    if (!user?.tenantId || !user?.userId) {
      throw new Error('Authenticated user required for SSE stream');
    }
    return this.sseGateway.subscribe(user.tenantId, user.userId);
  }
}
