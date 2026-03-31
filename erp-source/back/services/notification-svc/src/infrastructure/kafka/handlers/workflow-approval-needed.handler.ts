import { Injectable } from '@nestjs/common';
import { EventHandler } from '../kafka-event-consumer';
import { SendNotificationUseCase } from '../../../application/use-cases/send-notification.use-case';
import { NotificationChannel } from '../../../domain/value-objects/notification-channel.vo';

@Injectable()
export class WorkflowApprovalNeededHandler implements EventHandler {
  readonly eventType = 'workflow.approval.needed';

  constructor(private readonly sendNotification: SendNotificationUseCase) {}

  async handle(payload: Record<string, unknown>, tenantId: string): Promise<void> {
    const approverUserId = (payload.approverUserId as string) || '';
    await this.sendNotification.execute({
      tenantId,
      recipientUserId: approverUserId,
      recipientEmail: payload.approverEmail as string | undefined,
      channel: NotificationChannel.IN_APP,
      templateCode: 'workflow-approval-needed',
      variables: {
        workflowName: payload.workflowName,
        documentType: payload.documentType,
        documentId: payload.documentId,
        requesterName: payload.requesterName,
        stepName: payload.stepName,
      },
      metadata: { source: 'workflow-svc', workflowInstanceId: payload.workflowInstanceId },
    });

    // Also send push notification for approvals
    await this.sendNotification.execute({
      tenantId,
      recipientUserId: approverUserId,
      channel: NotificationChannel.PUSH,
      templateCode: 'workflow-approval-needed',
      variables: {
        workflowName: payload.workflowName,
        documentType: payload.documentType,
        documentId: payload.documentId,
        requesterName: payload.requesterName,
        stepName: payload.stepName,
      },
      metadata: { source: 'workflow-svc', workflowInstanceId: payload.workflowInstanceId },
    });
  }
}
