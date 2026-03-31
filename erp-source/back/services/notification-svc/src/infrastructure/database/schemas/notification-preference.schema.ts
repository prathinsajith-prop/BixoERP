import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type NotificationPreferenceDocument = HydratedDocument<NotificationPreferenceModel>;

export class ChannelPreferenceModel {
  @Prop({ required: true, enum: ['EMAIL', 'IN_APP', 'PUSH', 'SMS', 'WHATSAPP'] })
  channel!: string;

  @Prop({ required: true })
  enabled!: boolean;
}

@Schema({ collection: 'notification_preferences', timestamps: true })
export class NotificationPreferenceModel {
  @Prop({ required: true, index: true })
  tenantId!: string;

  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ type: [Object], default: [] })
  channels!: ChannelPreferenceModel[];

  @Prop()
  mutedUntil?: Date;

  @Prop({ default: false })
  doNotDisturb!: boolean;
}

export const NotificationPreferenceSchema = SchemaFactory.createForClass(NotificationPreferenceModel);

// Unique compound index: one preference per user per tenant
NotificationPreferenceSchema.index({ tenantId: 1, userId: 1 }, { unique: true });
