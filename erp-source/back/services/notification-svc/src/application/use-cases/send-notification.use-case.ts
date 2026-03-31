import { Injectable, Inject, Logger } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import { Notification } from '../../domain/entities/notification.entity';
import { NotificationChannel } from '../../domain/value-objects/notification-channel.vo';
import { NOTIFICATION_REPOSITORY, NotificationRepository } from '../../domain/repositories/notification.repository';
import { TEMPLATE_REPOSITORY, TemplateRepository } from '../../domain/repositories/template.repository';
import { PREFERENCE_REPOSITORY, PreferenceRepository } from '../../domain/repositories/preference.repository';
import { EVENT_PUBLISHER, EventPublisher } from '../ports/event-publisher.port';
import { EMAIL_SENDER, EmailSender } from '../ports/email-sender.port';
import { PUSH_SENDER, PushSender } from '../ports/push-sender.port';
import { WHATSAPP_SENDER, WhatsAppSender } from '../ports/whatsapp-sender.port';
import { SendNotificationDto } from '../dtos/send-notification.dto';
import { TemplateRenderException, ChannelDisabledException } from '../../domain/exceptions/domain.exceptions';
import { SseNotificationGateway } from '../../api/sse/notification-sse.gateway';

@Injectable()
export class SendNotificationUseCase {
  private readonly logger = new Logger(SendNotificationUseCase.name);

  constructor(
    @Inject(NOTIFICATION_REPOSITORY) private readonly notificationRepo: NotificationRepository,
    @Inject(TEMPLATE_REPOSITORY) private readonly templateRepo: TemplateRepository,
    @Inject(PREFERENCE_REPOSITORY) private readonly preferenceRepo: PreferenceRepository,
    @Inject(EVENT_PUBLISHER) private readonly eventPublisher: EventPublisher,
    @Inject(EMAIL_SENDER) private readonly emailSender: EmailSender,
    @Inject(PUSH_SENDER) private readonly pushSender: PushSender,
    @Inject(WHATSAPP_SENDER) private readonly whatsappSender: WhatsAppSender,
    private readonly sseGateway: SseNotificationGateway,
  ) {}

  async execute(dto: SendNotificationDto): Promise<Notification> {
    // Check user preferences
    const preference = await this.preferenceRepo.findByUserId(dto.tenantId, dto.recipientUserId);
    if (preference && !preference.isChannelEnabled(dto.channel)) {
      throw new ChannelDisabledException(dto.recipientUserId, dto.channel);
    }

    // Resolve subject and body from template if templateCode is provided
    let subject = dto.subject || '';
    let body = dto.body || '';

    if (dto.templateCode) {
      const template = await this.templateRepo.findByCode(dto.templateCode, dto.tenantId);
      if (template) {
        try {
          const compiledSubject = Handlebars.compile(template.subjectTemplate);
          const compiledBody = Handlebars.compile(template.bodyTemplate);
          subject = compiledSubject(dto.variables || {});
          body = compiledBody(dto.variables || {});
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          throw new TemplateRenderException(dto.templateCode, message);
        }
      }
    }

    // Create the notification aggregate
    const notification = Notification.create({
      tenantId: dto.tenantId,
      recipientUserId: dto.recipientUserId,
      channel: dto.channel,
      subject,
      body,
      templateId: dto.templateCode,
      metadata: dto.metadata,
    });

    // Dispatch by channel
    try {
      switch (dto.channel) {
        case NotificationChannel.EMAIL:
          if (dto.recipientEmail) {
            await this.emailSender.send({ to: dto.recipientEmail, subject, body });
          }
          notification.markSent();
          break;

        case NotificationChannel.PUSH:
          await this.pushSender.send({
            userId: dto.recipientUserId,
            title: subject,
            body,
            data: dto.metadata,
          });
          notification.markSent();
          break;

        case NotificationChannel.IN_APP:
          // In-app: just persist and push via SSE
          notification.markSent();
          this.sseGateway.pushToUser(dto.tenantId, dto.recipientUserId, {
            id: notification.id,
            subject,
            body,
            channel: dto.channel,
            createdAt: notification.createdAt.toISOString(),
          });
          break;

        case NotificationChannel.SMS:
          // SMS: mark sent (placeholder for SMS gateway integration)
          notification.markSent();
          break;

        case NotificationChannel.WHATSAPP:
          if (dto.recipientPhone) {
            await this.whatsappSender.send({
              to: dto.recipientPhone,
              body,
            });
          }
          notification.markSent();
          break;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to send notification: ${message}`);
      notification.markFailed(message);
    }

    await this.notificationRepo.save(notification);

    // Publish domain events
    const events = notification.clearDomainEvents();
    for (const event of events) {
      await this.eventPublisher.publish(event);
    }

    return notification;
  }
}
