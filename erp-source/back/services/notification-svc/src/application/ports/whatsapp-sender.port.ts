export interface WhatsAppSender {
  send(params: {
    to: string;
    body: string;
    templateName?: string;
    templateParams?: string[];
  }): Promise<void>;
}

export const WHATSAPP_SENDER = Symbol('WhatsAppSender');
