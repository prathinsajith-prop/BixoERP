import { Injectable } from '@nestjs/common';
import { EventHandler } from '../kafka-event-consumer';
import { SendNotificationUseCase } from '../../../application/use-cases/send-notification.use-case';
import { NotificationChannel } from '../../../domain/value-objects/notification-channel.vo';

@Injectable()
export class InvoicePaidHandler implements EventHandler {
  readonly eventType = 'invoice.paid';

  constructor(private readonly sendNotification: SendNotificationUseCase) {}

  async handle(payload: Record<string, unknown>, tenantId: string): Promise<void> {
    const recipientUserId = (payload.createdByUserId as string) || (payload.notifyUserId as string) || '';
    await this.sendNotification.execute({
      tenantId,
      recipientUserId,
      recipientEmail: payload.email as string | undefined,
      channel: NotificationChannel.EMAIL,
      templateCode: 'invoice-paid',
      variables: {
        invoiceNumber: payload.invoiceNumber,
        amount: payload.amount,
        currency: payload.currency,
        customerName: payload.customerName,
        paidAt: payload.paidAt,
      },
      metadata: { source: 'finance-svc', invoiceId: payload.invoiceId },
    });
  }
}
