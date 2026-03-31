import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type IntegrationLogDocument = HydratedDocument<IntegrationLogModel>;

@Schema({ collection: 'integration_logs', timestamps: true })
export class IntegrationLogModel {
  @Prop({ required: true, index: true })
  tenantId!: string;

  @Prop({ index: true })
  subscriptionId?: string;

  @Prop({ required: true, index: true })
  eventType!: string;

  @Prop({ required: true, enum: ['OUTBOUND', 'INBOUND'] })
  direction!: string;

  @Prop({ required: true })
  url!: string;

  @Prop({ required: true })
  method!: string;

  @Prop({ type: Object })
  requestHeaders?: Record<string, string>;

  @Prop({ type: Object })
  requestBody?: Record<string, unknown>;

  @Prop()
  responseStatus?: number;

  @Prop({ type: Object })
  responseHeaders?: Record<string, string>;

  @Prop()
  responseBody?: string;

  @Prop({ required: true, enum: ['SUCCESS', 'FAILED', 'PENDING', 'RETRYING'], default: 'PENDING', index: true })
  status!: string;

  @Prop()
  durationMs?: number;

  @Prop({ required: true, default: 1 })
  attempt!: number;

  @Prop()
  errorMessage?: string;
}

export const IntegrationLogSchema = SchemaFactory.createForClass(IntegrationLogModel);

IntegrationLogSchema.index({ tenantId: 1, createdAt: -1 });
IntegrationLogSchema.index({ tenantId: 1, subscriptionId: 1, status: 1 });
IntegrationLogSchema.index({ tenantId: 1, eventType: 1 });
// TTL: auto-delete logs after 90 days
IntegrationLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
