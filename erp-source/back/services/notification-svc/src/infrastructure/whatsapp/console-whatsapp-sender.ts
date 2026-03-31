import { Injectable, Logger } from '@nestjs/common';
import { WhatsAppSender } from '../../application/ports/whatsapp-sender.port';

/**
 * Console-based WhatsApp sender stub for development.
 * Replace with Meta Cloud API / Twilio WhatsApp in production.
 */
@Injectable()
export class ConsoleWhatsAppSender implements WhatsAppSender {
  private readonly logger = new Logger(ConsoleWhatsAppSender.name);

  async send(params: {
    to: string;
    body: string;
    templateName?: string;
    templateParams?: string[];
  }): Promise<void> {
    this.logger.log(
      `[WhatsApp] To: ${params.to} | Template: ${params.templateName || 'none'} | Body: ${params.body.substring(0, 120)}`,
    );
  }
}
