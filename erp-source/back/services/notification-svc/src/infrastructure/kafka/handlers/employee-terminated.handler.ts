import { Injectable } from '@nestjs/common';
import { EventHandler } from '../kafka-event-consumer';
import { SendNotificationUseCase } from '../../../application/use-cases/send-notification.use-case';
import { NotificationChannel } from '../../../domain/value-objects/notification-channel.vo';

@Injectable()
export class EmployeeTerminatedHandler implements EventHandler {
  readonly eventType = 'employee.terminated';

  constructor(private readonly sendNotification: SendNotificationUseCase) {}

  async handle(payload: Record<string, unknown>, tenantId: string): Promise<void> {
    const hrManagerUserId = (payload.hrManagerUserId as string) || (payload.notifyUserId as string) || '';
    await this.sendNotification.execute({
      tenantId,
      recipientUserId: hrManagerUserId,
      recipientEmail: payload.hrManagerEmail as string | undefined,
      channel: NotificationChannel.IN_APP,
      templateCode: 'employee-terminated',
      variables: {
        employeeName: payload.employeeName,
        employeeCode: payload.employeeCode,
        terminationDate: payload.terminationDate,
        reason: payload.reason,
      },
      metadata: { source: 'hr-svc', employeeId: payload.employeeId },
    });
  }
}
