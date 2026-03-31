import { v4 as uuidv4 } from 'uuid';
import { NotificationChannel } from '../value-objects/notification-channel.vo';

export interface ChannelPreference {
  channel: NotificationChannel;
  enabled: boolean;
}

export interface NotificationPreferenceProps {
  tenantId: string;
  userId: string;
  channels: ChannelPreference[];
  mutedUntil?: Date;
  doNotDisturb: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class NotificationPreference {
  private readonly _id: string;
  private props: NotificationPreferenceProps;

  constructor(props: NotificationPreferenceProps, id: string) {
    this._id = id;
    this.props = props;
  }

  get id(): string { return this._id; }
  get tenantId(): string { return this.props.tenantId; }
  get userId(): string { return this.props.userId; }
  get channels(): ChannelPreference[] { return this.props.channels; }
  get mutedUntil(): Date | undefined { return this.props.mutedUntil; }
  get doNotDisturb(): boolean { return this.props.doNotDisturb; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  static createDefault(tenantId: string, userId: string): NotificationPreference {
    const now = new Date();
    return new NotificationPreference(
      {
        tenantId,
        userId,
        channels: [
          { channel: NotificationChannel.EMAIL, enabled: true },
          { channel: NotificationChannel.IN_APP, enabled: true },
          { channel: NotificationChannel.PUSH, enabled: true },
          { channel: NotificationChannel.SMS, enabled: false },
          { channel: NotificationChannel.WHATSAPP, enabled: false },
        ],
        doNotDisturb: false,
        createdAt: now,
        updatedAt: now,
      },
      uuidv4(),
    );
  }

  isChannelEnabled(channel: NotificationChannel): boolean {
    if (this.props.doNotDisturb) return false;
    if (this.props.mutedUntil && this.props.mutedUntil > new Date()) return false;
    const pref = this.props.channels.find((c) => c.channel === channel);
    return pref?.enabled ?? true;
  }

  updateChannel(channel: NotificationChannel, enabled: boolean): void {
    const existing = this.props.channels.find((c) => c.channel === channel);
    if (existing) {
      existing.enabled = enabled;
    } else {
      this.props.channels.push({ channel, enabled });
    }
    this.props.updatedAt = new Date();
  }

  setDoNotDisturb(enabled: boolean): void {
    this.props.doNotDisturb = enabled;
    this.props.updatedAt = new Date();
  }

  muteUntil(until: Date): void {
    this.props.mutedUntil = until;
    this.props.updatedAt = new Date();
  }

  static reconstitute(id: string, props: NotificationPreferenceProps): NotificationPreference {
    return new NotificationPreference(props, id);
  }
}
