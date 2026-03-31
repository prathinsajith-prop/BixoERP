import { Injectable } from '@nestjs/common';
import { EventHandler } from '../kafka-event-consumer';
import { SendNotificationUseCase } from '../../../application/use-cases/send-notification.use-case';
import { NotificationChannel } from '../../../domain/value-objects/notification-channel.vo';

@Injectable()
export class StockBelowReorderHandler implements EventHandler {
  readonly eventType = 'stock.below.reorder';

  constructor(private readonly sendNotification: SendNotificationUseCase) {}

  async handle(payload: Record<string, unknown>, tenantId: string): Promise<void> {
    const recipientUserId = (payload.warehouseManagerId as string) || (payload.notifyUserId as string) || '';
    await this.sendNotification.execute({
      tenantId,
      recipientUserId,
      recipientEmail: payload.email as string | undefined,
      channel: NotificationChannel.IN_APP,
      templateCode: 'stock-below-reorder',
      variables: {
        itemName: payload.itemName,
        itemCode: payload.itemCode,
        currentStock: payload.currentStock,
        reorderLevel: payload.reorderLevel,
        warehouseName: payload.warehouseName,
      },
      metadata: { source: 'inventory-svc', itemId: payload.itemId },
    });
  }
}
