import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type NotificationTemplateDocument = HydratedDocument<NotificationTemplateModel>;

export class TemplateVariableModel {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, enum: ['string', 'number', 'date', 'boolean'] })
  type!: string;

  @Prop({ required: true })
  required!: boolean;

  @Prop()
  defaultValue?: string;
}

@Schema({ collection: 'notification_templates', timestamps: true })
export class NotificationTemplateModel {
  @Prop({ required: true, index: true })
  tenantId!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, index: true })
  code!: string;

  @Prop({ required: true, enum: ['EMAIL', 'IN_APP', 'PUSH', 'SMS', 'WHATSAPP'] })
  channel!: string;

  @Prop({ required: true })
  subjectTemplate!: string;

  @Prop({ required: true })
  bodyTemplate!: string;

  @Prop({ type: [Object], default: [] })
  variables!: TemplateVariableModel[];

  @Prop({ default: true })
  isActive!: boolean;
}

export const NotificationTemplateSchema = SchemaFactory.createForClass(NotificationTemplateModel);

// Unique compound index: one template code per tenant
NotificationTemplateSchema.index({ tenantId: 1, code: 1 }, { unique: true });
