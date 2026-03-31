import { AggregateRoot, DomainEvent } from './aggregate-root.base';
import { NotificationChannel } from '../value-objects/notification-channel.vo';
import { NotificationStatus } from '../value-objects/notification-status.vo';
import { v4 as uuidv4 } from 'uuid';
import { InvalidNotificationTransition } from '../exceptions/domain.exceptions';

export interface NotificationProps {
  tenantId: string;
  recipientUserId: string;
  channel: NotificationChannel;
  subject: string;
  body: string;
  templateId?: string;
  status: NotificationStatus;
  metadata?: Record<string, unknown>;
  sentAt?: Date;
  readAt?: Date;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Notification extends AggregateRoot<NotificationProps> {
  get tenantId(): string { return this.props.tenantId; }
  get recipientUserId(): string { return this.props.recipientUserId; }
  get channel(): NotificationChannel { return this.props.channel; }
  get subject(): string { return this.props.subject; }
  get body(): string { return this.props.body; }
  get templateId(): string | undefined { return this.props.templateId; }
  get status(): NotificationStatus { return this.props.status; }
  get metadata(): Record<string, unknown> | undefined { return this.props.metadata; }
  get sentAt(): Date | undefined { return this.props.sentAt; }
  get readAt(): Date | undefined { return this.props.readAt; }
  get failureReason(): string | undefined { return this.props.failureReason; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  static create(params: {
    tenantId: string;
    recipientUserId: string;
    channel: NotificationChannel;
    subject: string;
    body: string;
    templateId?: string;
    metadata?: Record<string, unknown>;
  }): Notification {
    const id = uuidv4();
    const now = new Date();
    const notification = new Notification(
      {
        tenantId: params.tenantId,
        recipientUserId: params.recipientUserId,
        channel: params.channel,
        subject: params.subject,
        body: params.body,
        templateId: params.templateId,
        status: NotificationStatus.PENDING,
        metadata: params.metadata,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
    notification.addDomainEvent({
      eventId: uuidv4(),
      eventType: 'notification.created',
      aggregateId: id,
      tenantId: params.tenantId,
      occurredAt: now,
      payload: {
        recipientUserId: params.recipientUserId,
        channel: params.channel,
        subject: params.subject,
      },
    });
    return notification;
  }

  markSent(): void {
    if (this.props.status !== NotificationStatus.PENDING) {
      throw new InvalidNotificationTransition(this.props.status, NotificationStatus.SENT);
    }
    this.props.status = NotificationStatus.SENT;
    this.props.sentAt = new Date();
    this.props.updatedAt = new Date();
    this.addDomainEvent({
      eventId: uuidv4(),
      eventType: 'notification.sent',
      aggregateId: this._id,
      tenantId: this.props.tenantId,
      occurredAt: new Date(),
      payload: { channel: this.props.channel },
    });
  }

  markFailed(reason: string): void {
    if (this.props.status !== NotificationStatus.PENDING) {
      throw new InvalidNotificationTransition(this.props.status, NotificationStatus.FAILED);
    }
    this.props.status = NotificationStatus.FAILED;
    this.props.failureReason = reason;
    this.props.updatedAt = new Date();
  }

  markRead(): void {
    if (this.props.status !== NotificationStatus.SENT) {
      throw new InvalidNotificationTransition(this.props.status, NotificationStatus.READ);
    }
    this.props.status = NotificationStatus.READ;
    this.props.readAt = new Date();
    this.props.updatedAt = new Date();
    this.addDomainEvent({
      eventId: uuidv4(),
      eventType: 'notification.read',
      aggregateId: this._id,
      tenantId: this.props.tenantId,
      occurredAt: new Date(),
      payload: { recipientUserId: this.props.recipientUserId },
    });
  }

  static reconstitute(id: string, props: NotificationProps): Notification {
    return new Notification(props, id);
  }
}
