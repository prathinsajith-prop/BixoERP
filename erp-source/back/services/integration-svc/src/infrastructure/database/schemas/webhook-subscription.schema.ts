import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type WebhookSubscriptionDocument = HydratedDocument<WebhookSubscriptionModel>;

@Schema({ collection: 'webhook_subscriptions', timestamps: true })
export class WebhookSubscriptionModel {
  @Prop({ required: true, index: true })
  tenantId!: string;

  @Prop({ required: true })
  url!: string;

  @Prop({ required: true, type: [String] })
  events!: string[];

  @Prop({ required: true })
  secret!: string;

  @Prop({ required: true, enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'], default: 'ACTIVE', index: true })
  status!: string;

  @Prop()
  description?: string;

  @Prop({ type: Object })
  headers?: Record<string, string>;

  @Prop({ required: true, default: 0 })
  failureCount!: number;

  @Prop()
  lastDeliveredAt?: Date;

  @Prop({ required: true })
  createdBy!: string;
}

export const WebhookSubscriptionSchema = SchemaFactory.createForClass(WebhookSubscriptionModel);

WebhookSubscriptionSchema.index({ tenantId: 1, status: 1 });
WebhookSubscriptionSchema.index({ tenantId: 1, events: 1, status: 1 });
WebhookSubscriptionSchema.index({ events: 1, status: 1 });
