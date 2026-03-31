import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export interface SseNotification {
  id: string;
  subject: string;
  body: string;
  channel: string;
  createdAt: string;
}

interface UserNotificationEvent {
  tenantId: string;
  userId: string;
  notification: SseNotification;
}

@Injectable()
export class SseNotificationGateway {
  private readonly logger = new Logger(SseNotificationGateway.name);
  private readonly events$ = new Subject<UserNotificationEvent>();

  pushToUser(tenantId: string, userId: string, notification: SseNotification): void {
    this.events$.next({ tenantId, userId, notification });
    this.logger.debug(`SSE push to ${tenantId}:${userId} — ${notification.subject}`);
  }

  subscribe(tenantId: string, userId: string): Observable<MessageEvent> {
    return this.events$.pipe(
      filter((evt) => evt.tenantId === tenantId && evt.userId === userId),
      map((evt) => ({
        data: JSON.stringify(evt.notification),
        type: 'notification',
      } as MessageEvent)),
    );
  }
}
