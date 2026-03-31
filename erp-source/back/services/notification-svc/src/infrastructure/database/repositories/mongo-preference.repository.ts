import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PreferenceRepository } from '../../../domain/repositories/preference.repository';
import { NotificationPreference, NotificationPreferenceProps, ChannelPreference } from '../../../domain/entities/notification-preference.entity';
import { NotificationChannel } from '../../../domain/value-objects/notification-channel.vo';
import { NotificationPreferenceModel, NotificationPreferenceDocument } from '../schemas/notification-preference.schema';

@Injectable()
export class MongoPreferenceRepository implements PreferenceRepository {
  constructor(
    @InjectModel(NotificationPreferenceModel.name) private readonly model: Model<NotificationPreferenceDocument>,
  ) {}

  async save(preference: NotificationPreference): Promise<void> {
    await this.model.findOneAndUpdate(
      { _id: preference.id },
      {
        _id: preference.id,
        tenantId: preference.tenantId,
        userId: preference.userId,
        channels: preference.channels,
        mutedUntil: preference.mutedUntil,
        doNotDisturb: preference.doNotDisturb,
      },
      { upsert: true, new: true },
    );
  }

  async findByUserId(tenantId: string, userId: string): Promise<NotificationPreference | null> {
    const doc = await this.model.findOne({ tenantId, userId }).lean().exec();
    if (!doc) return null;
    return this.toDomain(doc);
  }

  private toDomain(doc: Record<string, any>): NotificationPreference {
    const channels: ChannelPreference[] = (doc.channels || []).map((c: any) => ({
      channel: c.channel as NotificationChannel,
      enabled: c.enabled,
    }));
    const props: NotificationPreferenceProps = {
      tenantId: doc.tenantId,
      userId: doc.userId,
      channels,
      mutedUntil: doc.mutedUntil,
      doNotDisturb: doc.doNotDisturb,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
    return NotificationPreference.reconstitute(doc._id.toString(), props);
  }
}
