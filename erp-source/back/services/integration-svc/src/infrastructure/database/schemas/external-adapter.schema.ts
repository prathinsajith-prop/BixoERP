import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ExternalAdapterDocument = HydratedDocument<ExternalAdapterModel>;

@Schema({ collection: 'external_adapters', timestamps: true })
export class ExternalAdapterModel {
  @Prop({ required: true, index: true })
  tenantId!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  type!: string;

  @Prop({ required: true })
  baseUrl!: string;

  @Prop({ required: true, enum: ['API_KEY', 'OAUTH2', 'BASIC', 'BEARER', 'NONE'] })
  authType!: string;

  @Prop({ type: Object, required: true })
  authConfig!: Record<string, unknown>;

  @Prop({ type: Object })
  headers?: Record<string, string>;

  @Prop({ required: true, default: true })
  enabled!: boolean;

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;

  @Prop({ required: true })
  createdBy!: string;
}

export const ExternalAdapterSchema = SchemaFactory.createForClass(ExternalAdapterModel);

ExternalAdapterSchema.index({ tenantId: 1, type: 1 });
ExternalAdapterSchema.index({ tenantId: 1, name: 1 }, { unique: true });
