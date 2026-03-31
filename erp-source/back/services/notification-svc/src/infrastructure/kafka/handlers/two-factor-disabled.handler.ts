import { Injectable } from '@nestjs/common';
import { EventHandler } from '../kafka-event-consumer';
import { SendNotificationUseCase } from '../../../application/use-cases/send-notification.use-case';
import { NotificationChannel } from '../../../domain/value-objects/notification-channel.vo';

@Injectable()
export class TwoFactorDisabledHandler implements EventHandler {
  readonly eventType = 'two-factor.disabled';

  constructor(private readonly sendNotification: SendNotificationUseCase) {}

  async handle(payload: Record<string, unknown>, tenantId: string): Promise<void> {
    const userId = payload.userId as string;
    const email = payload.email as string | undefined;
    if (!email) return;

    await this.sendNotification.execute({
      tenantId,
      recipientUserId: userId,
      recipientEmail: email,
      channel: NotificationChannel.EMAIL,
      subject: 'Two-Factor Authentication Disabled',
      body: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e293b;">Two-Factor Authentication Disabled</h2>
          <p>Two-factor authentication has been removed from your account.</p>
          <p style="margin-top: 24px; padding: 16px; background: #fee2e2; border-radius: 8px; color: #991b1b;">
            <strong>Warning:</strong> Your account is now less secure. We strongly recommend re-enabling
            two-factor authentication to protect your account.
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 12px; color: #94a3b8;">If you did not make this change, please change your password and contact support immediately.</p>
        </div>
      `,
      metadata: { source: 'core', action: 'two-factor-disabled' },
    });
  }
}
