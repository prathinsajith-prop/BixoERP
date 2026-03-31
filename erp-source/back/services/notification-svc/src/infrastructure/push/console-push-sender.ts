import { Injectable, Logger } from '@nestjs/common';
import { PushSender } from '../../application/ports/push-sender.port';

/**
 * Console-based push sender stub.
 * Replace with FCM / APNs / WebPush in production.
 */
@Injectable()
export class ConsolePushSender implements PushSender {
  private readonly logger = new Logger(ConsolePushSender.name);

  async send(params: {
    userId: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }): Promise<void> {
    this.logger.log(
      `[PUSH] UserId: ${params.userId} | Title: ${params.title} | Body length: ${params.body.length}`,
    );
  }
}
