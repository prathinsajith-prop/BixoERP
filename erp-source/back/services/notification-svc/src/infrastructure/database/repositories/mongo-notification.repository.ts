import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationRepository } from '../../../domain/repositories/notification.repository';
import { Notification, NotificationProps } from '../../../domain/entities/notification.entity';
import { NotificationChannel } from '../../../domain/value-objects/notification-channel.vo';
import { NotificationStatus } from '../../../domain/value-objects/notification-status.vo';
import { NotificationModel, NotificationDocument } from '../schemas/notification.schema';

@Injectable()
export class MongoNotificationRepository implements NotificationRepository {
  constructor(
    @InjectModel(NotificationModel.name) private readonly model: Model<NotificationDocument>,
  ) {}

  async save(notification: Notification): Promise<void> {
    await this.model.findOneAndUpdate(
      { _id: notification.id },
      {
        _id: notification.id,
        tenantId: notification.tenantId,
        recipientUserId: notification.recipientUserId,
        channel: notification.channel,
        subject: notification.subject,
        body: notification.body,
        templateId: notification.templateId,
        status: notification.status,
        metadata: notification.metadata,
        sentAt: notification.sentAt,
        readAt: notification.readAt,
        failureReason: notification.failureReason,
      },
      { upsert: true, new: true },
    );
  }

  async findById(id: string, tenantId: string): Promise<Notification | null> {
    const doc = await this.model.findOne({ _id: id, tenantId }).lean().exec();
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async findByRecipient(
    tenantId: string,
    userId: string,
    options?: { limit?: number; offset?: number; unreadOnly?: boolean },
  ): Promise<Notification[]> {
    const filter: Record<string, unknown> = { tenantId, recipientUserId: userId };
    if (options?.unreadOnly) {
      filter.status = { $in: [NotificationStatus.SENT] };
    }

    const docs = await this.model
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(options?.offset || 0)
      .limit(options?.limit || 50)
      .lean()
      .exec();

    return docs.map((d) => this.toDomain(d));
  }

  async countUnread(tenantId: string, userId: string): Promise<number> {
    return this.model.countDocuments({
      tenantId,
      recipientUserId: userId,
      status: NotificationStatus.SENT,
    });
  }

  async markManyAsRead(ids: string[], tenantId: string): Promise<void> {
    await this.model.updateMany(
      { _id: { $in: ids }, tenantId, status: NotificationStatus.SENT },
      { $set: { status: NotificationStatus.READ, readAt: new Date() } },
    );
  }

  private toDomain(doc: Record<string, any>): Notification {
    const props: NotificationProps = {
      tenantId: doc.tenantId,
      recipientUserId: doc.recipientUserId,
      channel: doc.channel as NotificationChannel,
      subject: doc.subject,
      body: doc.body,
      templateId: doc.templateId,
      status: doc.status as NotificationStatus,
      metadata: doc.metadata,
      sentAt: doc.sentAt,
      readAt: doc.readAt,
      failureReason: doc.failureReason,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
    return Notification.reconstitute(doc._id.toString(), props);
  }
}
