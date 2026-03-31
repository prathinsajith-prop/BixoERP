import { Injectable } from '@nestjs/common';
import { EventHandler } from '../kafka-event-consumer';
import { SendNotificationUseCase } from '../../../application/use-cases/send-notification.use-case';
import { NotificationChannel } from '../../../domain/value-objects/notification-channel.vo';

@Injectable()
export class ProjectBudgetExceededHandler implements EventHandler {
  readonly eventType = 'project.budget.exceeded';

  constructor(private readonly sendNotification: SendNotificationUseCase) {}

  async handle(payload: Record<string, unknown>, tenantId: string): Promise<void> {
    const projectManagerUserId = (payload.projectManagerUserId as string) || (payload.notifyUserId as string) || '';
    await this.sendNotification.execute({
      tenantId,
      recipientUserId: projectManagerUserId,
      recipientEmail: payload.projectManagerEmail as string | undefined,
      channel: NotificationChannel.IN_APP,
      templateCode: 'project-budget-exceeded',
      variables: {
        projectName: payload.projectName,
        projectCode: payload.projectCode,
        budgetAmount: payload.budgetAmount,
        actualSpend: payload.actualSpend,
        currency: payload.currency,
        overagePercent: payload.overagePercent,
      },
      metadata: { source: 'project-svc', projectId: payload.projectId },
    });

    // Also send email for budget exceedances
    await this.sendNotification.execute({
      tenantId,
      recipientUserId: projectManagerUserId,
      recipientEmail: payload.projectManagerEmail as string | undefined,
      channel: NotificationChannel.EMAIL,
      templateCode: 'project-budget-exceeded',
      variables: {
        projectName: payload.projectName,
        projectCode: payload.projectCode,
        budgetAmount: payload.budgetAmount,
        actualSpend: payload.actualSpend,
        currency: payload.currency,
        overagePercent: payload.overagePercent,
      },
      metadata: { source: 'project-svc', projectId: payload.projectId },
    });
  }
}
