import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TemplateRepository } from '../../../domain/repositories/template.repository';
import { NotificationTemplate, NotificationTemplateProps, TemplateVariable } from '../../../domain/entities/notification-template.entity';
import { NotificationChannel } from '../../../domain/value-objects/notification-channel.vo';
import { NotificationTemplateModel, NotificationTemplateDocument } from '../schemas/notification-template.schema';

@Injectable()
export class MongoTemplateRepository implements TemplateRepository {
  constructor(
    @InjectModel(NotificationTemplateModel.name) private readonly model: Model<NotificationTemplateDocument>,
  ) {}

  async save(template: NotificationTemplate): Promise<void> {
    await this.model.findOneAndUpdate(
      { _id: template.id },
      {
        _id: template.id,
        tenantId: template.tenantId,
        name: template.name,
        code: template.code,
        channel: template.channel,
        subjectTemplate: template.subjectTemplate,
        bodyTemplate: template.bodyTemplate,
        variables: template.variables,
        isActive: template.isActive,
      },
      { upsert: true, new: true },
    );
  }

  async findById(id: string, tenantId: string): Promise<NotificationTemplate | null> {
    const doc = await this.model.findOne({ _id: id, tenantId }).lean().exec();
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async findByCode(code: string, tenantId: string): Promise<NotificationTemplate | null> {
    const doc = await this.model.findOne({ code, tenantId }).lean().exec();
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async findAll(tenantId: string, options?: { activeOnly?: boolean }): Promise<NotificationTemplate[]> {
    const filter: Record<string, unknown> = { tenantId };
    if (options?.activeOnly) {
      filter.isActive = true;
    }
    const docs = await this.model.find(filter).sort({ createdAt: -1 }).lean().exec();
    return docs.map((d) => this.toDomain(d));
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.model.deleteOne({ _id: id, tenantId });
  }

  private toDomain(doc: Record<string, any>): NotificationTemplate {
    const props: NotificationTemplateProps = {
      tenantId: doc.tenantId,
      name: doc.name,
      code: doc.code,
      channel: doc.channel as NotificationChannel,
      subjectTemplate: doc.subjectTemplate,
      bodyTemplate: doc.bodyTemplate,
      variables: doc.variables as TemplateVariable[],
      isActive: doc.isActive,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
    return NotificationTemplate.reconstitute(doc._id.toString(), props);
  }
}
