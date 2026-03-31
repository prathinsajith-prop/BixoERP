import { Injectable } from '@nestjs/common';
import { EventHandler } from '../kafka-event-consumer';
import { DeliverWebhookUseCase } from '../../../application/use-cases/deliver-webhook.use-case';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WorkflowCompletedHandler implements EventHandler {
  readonly eventType = 'workflow.completed';

  constructor(private readonly deliverWebhook: DeliverWebhookUseCase) {}

  async handle(payload: Record<string, unknown>, tenantId: string): Promise<void> {
    await this.deliverWebhook.execute({
      eventType: this.eventType,
      tenantId,
      payload,
      eventId: (payload.eventId as string) || uuidv4(),
    });
  }
}
