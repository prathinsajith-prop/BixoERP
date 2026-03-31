import { Injectable, Logger } from '@nestjs/common';
import { EmailSender } from '../../application/ports/email-sender.port';

/**
 * Console-based email sender stub.
 * Replace with a real provider (SES, SendGrid, SMTP) in production.
 */
@Injectable()
export class ConsoleEmailSender implements EmailSender {
  private readonly logger = new Logger(ConsoleEmailSender.name);

  async send(params: {
    to: string;
    subject: string;
    body: string;
    from?: string;
    replyTo?: string;
  }): Promise<void> {
    this.logger.log(
      `[EMAIL] To: ${params.to} | Subject: ${params.subject} | Body length: ${params.body.length}`,
    );
  }
}
