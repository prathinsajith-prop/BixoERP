import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WebhookSubscriptionRepository } from '../../../domain/repositories/webhook-subscription.repository';
import { WebhookSubscription, WebhookSubscriptionProps } from '../../../domain/entities/webhook-subscription.entity';
import { WebhookStatus } from '../../../domain/value-objects/webhook-status.vo';
import { WebhookSubscriptionModel, WebhookSubscriptionDocument } from '../schemas/webhook-subscription.schema';

@Injectable()
export class MongoWebhookSubscriptionRepository implements WebhookSubscriptionRepository {
  constructor(
    @InjectModel(WebhookSubscriptionModel.name) private readonly model: Model<WebhookSubscriptionDocument>,
  ) {}

  async save(subscription: WebhookSubscription): Promise<void> {
    await this.model.findOneAndUpdate(
      { _id: subscription.id },
      {
        _id: subscription.id,
        tenantId: subscription.tenantId,
        url: subscription.url,
        events: subscription.events,
        secret: subscription.secret,
        status: subscription.status,
        description: subscription.description,
        headers: subscription.headers,
        failureCount: subscription.failureCount,
        lastDeliveredAt: subscription.lastDeliveredAt,
        createdBy: subscription.createdBy,
      },
      { upsert: true, new: true },
    );
  }

  async findById(id: string, tenantId: string): Promise<WebhookSubscription | null> {
    const doc = await this.model.findOne({ _id: id, tenantId }).lean().exec();
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async findByTenant(
    tenantId: string,
    options?: { limit?: number; offset?: number; status?: string },
  ): Promise<WebhookSubscription[]> {
    const filter: Record<string, unknown> = { tenantId };
    if (options?.status) filter.status = options.status;

    const docs = await this.model
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(options?.offset || 0)
      .limit(options?.limit || 50)
      .lean()
      .exec();

    return docs.map((doc) => this.toDomain(doc));
  }

  async findActiveByEvent(tenantId: string, eventType: string): Promise<WebhookSubscription[]> {
    const docs = await this.model
      .find({
        tenantId,
        status: WebhookStatus.ACTIVE,
        $or: [{ events: eventType }, { events: '*' }],
      })
      .lean()
      .exec();

    return docs.map((doc) => this.toDomain(doc));
  }

  async findAllActiveByEvent(eventType: string): Promise<WebhookSubscription[]> {
    const docs = await this.model
      .find({
        status: WebhookStatus.ACTIVE,
        $or: [{ events: eventType }, { events: '*' }],
      })
      .lean()
      .exec();

    return docs.map((doc) => this.toDomain(doc));
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.model.deleteOne({ _id: id, tenantId }).exec();
  }

  private toDomain(doc: Record<string, any>): WebhookSubscription {
    return WebhookSubscription.reconstitute(
      {
        tenantId: doc.tenantId,
        url: doc.url,
        events: doc.events,
        secret: doc.secret,
        status: doc.status as WebhookStatus,
        description: doc.description,
        headers: doc.headers,
        failureCount: doc.failureCount || 0,
        lastDeliveredAt: doc.lastDeliveredAt,
        createdBy: doc.createdBy,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      },
      doc._id.toString(),
    );
  }
}
