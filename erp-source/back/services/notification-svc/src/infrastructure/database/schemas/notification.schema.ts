import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type NotificationDocument = HydratedDocument<NotificationModel>;

@Schema({ collection: 'notifications', timestamps: true })
export class NotificationModel {
  @Prop({ required: true, index: true })
  tenantId!: string;

  @Prop({ required: true, index: true })
  recipientUserId!: string;

  @Prop({ required: true, enum: ['EMAIL', 'IN_APP', 'PUSH', 'SMS', 'WHATSAPP'] })
  channel!: string;

  @Prop({ required: true })
  subject!: string;

  @Prop({ required: true })
  body!: string;

  @Prop()
  templateId?: string;

  @Prop({ required: true, enum: ['PENDING', 'SENT', 'FAILED', 'READ'], default: 'PENDING', index: true })
  status!: string;

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;

  @Prop()
  sentAt?: Date;

  @Prop()
  readAt?: Date;

  @Prop()
  failureReason?: string;
}

export const NotificationSchema = SchemaFactory.createForClass(NotificationModel);

// Compound indexes for common query patterns
NotificationSchema.index({ tenantId: 1, recipientUserId: 1, status: 1 });
NotificationSchema.index({ tenantId: 1, createdAt: -1 });
