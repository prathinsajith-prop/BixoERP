import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProcessedEventDocument = HydratedDocument<ProcessedEventModel>;

@Schema({ collection: 'processed_events', timestamps: true })
export class ProcessedEventModel {
  @Prop({ required: true, index: true })
  eventId!: string;

  @Prop({ required: true })
  tenantId!: string;

  @Prop({ required: true })
  eventType!: string;

  @Prop()
  processedAt!: Date;
}

export const ProcessedEventSchema = SchemaFactory.createForClass(ProcessedEventModel);

ProcessedEventSchema.index({ eventId: 1, tenantId: 1 }, { unique: true });
// TTL index: auto-delete processed events after 30 days
ProcessedEventSchema.index({ processedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
