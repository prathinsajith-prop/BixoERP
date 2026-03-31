import { Injectable } from '@nestjs/common';
import { EventHandler } from '../kafka-event-consumer';
import { SendNotificationUseCase } from '../../../application/use-cases/send-notification.use-case';
import { NotificationChannel } from '../../../domain/value-objects/notification-channel.vo';

@Injectable()
export class PayrollProcessedHandler implements EventHandler {
  readonly eventType = 'payroll.processed';

  constructor(private readonly sendNotification: SendNotificationUseCase) {}

  async handle(payload: Record<string, unknown>, tenantId: string): Promise<void> {
    const recipientUserId = (payload.employeeUserId as string) || '';
    await this.sendNotification.execute({
      tenantId,
      recipientUserId,
      recipientEmail: payload.employeeEmail as string | undefined,
      channel: NotificationChannel.EMAIL,
      templateCode: 'payroll-processed',
      variables: {
        employeeName: payload.employeeName,
        period: payload.period,
        netPay: payload.netPay,
        currency: payload.currency,
        payDate: payload.payDate,
      },
      metadata: { source: 'hr-svc', payrollId: payload.payrollId },
    });
  }
}
