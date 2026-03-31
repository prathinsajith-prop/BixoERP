import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WhatsAppSender } from '../../application/ports/whatsapp-sender.port';

/**
 * WhatsApp sender using Meta Cloud API (WhatsApp Business Platform).
 * Requires a Meta Business account with WhatsApp Business API access.
 *
 * Env vars:
 *   WHATSAPP_API_URL      – e.g. https://graph.facebook.com/v21.0/<PHONE_NUMBER_ID>/messages
 *   WHATSAPP_ACCESS_TOKEN – permanent or system-user token
 *   WHATSAPP_PHONE_ID     – sender phone number ID (fallback for URL construction)
 */
@Injectable()
export class MetaWhatsAppSender implements WhatsAppSender, OnModuleInit {
  private readonly logger = new Logger(MetaWhatsAppSender.name);
  private apiUrl!: string;
  private accessToken!: string;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const phoneId = this.config.get<string>('whatsapp.phoneNumberId') || '';
    this.apiUrl =
      this.config.get<string>('whatsapp.apiUrl') ||
      `https://graph.facebook.com/v21.0/${phoneId}/messages`;
    this.accessToken = this.config.get<string>('whatsapp.accessToken') || '';

    if (!this.accessToken) {
      this.logger.warn('WhatsApp access token not configured — messages will fail');
    } else {
      this.logger.log('WhatsApp Cloud API sender initialised');
    }
  }

  async send(params: {
    to: string;
    body: string;
    templateName?: string;
    templateParams?: string[];
  }): Promise<void> {
    const payload = params.templateName
      ? this.buildTemplatePayload(params.to, params.templateName, params.templateParams)
      : this.buildTextPayload(params.to, params.body);

    const res = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`WhatsApp API ${res.status}: ${errBody}`);
    }

    this.logger.log(`WhatsApp message sent to ${params.to}`);
  }

  private buildTextPayload(to: string, body: string) {
    return {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { preview_url: false, body },
    };
  }

  private buildTemplatePayload(to: string, templateName: string, params?: string[]) {
    return {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en_US' },
        components: params?.length
          ? [
              {
                type: 'body',
                parameters: params.map((p) => ({ type: 'text', text: p })),
              },
            ]
          : [],
      },
    };
  }
}
