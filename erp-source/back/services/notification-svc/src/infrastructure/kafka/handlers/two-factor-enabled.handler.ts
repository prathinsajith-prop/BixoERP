import { Injectable } from '@nestjs/common';
import { EventHandler } from '../kafka-event-consumer';
import { SendNotificationUseCase } from '../../../application/use-cases/send-notification.use-case';
import { NotificationChannel } from '../../../domain/value-objects/notification-channel.vo';

@Injectable()
export class TwoFactorEnabledHandler implements EventHandler {
  readonly eventType = 'two-factor.enabled';

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
      subject: 'Two-Factor Authentication Enabled',
      body: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e293b;">Two-Factor Authentication Enabled</h2>
          <p>Two-factor authentication has been successfully enabled on your account.</p>
          <p>From now on, you will need your authenticator app to sign in.</p>
          <p style="margin-top: 24px; padding: 16px; background: #fef3c7; border-radius: 8px; color: #92400e;">
            <strong>Security tip:</strong> Store your recovery codes in a safe place.
            If you lose access to your authenticator app, recovery codes are the only way to regain access.
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 12px; color: #94a3b8;">If you did not make this change, please contact support immediately.</p>
        </div>
      `,
      metadata: { source: 'core', action: 'two-factor-enabled' },
    });
  }
}
