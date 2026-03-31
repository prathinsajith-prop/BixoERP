export interface EmailSender {
  send(params: {
    to: string;
    subject: string;
    body: string;
    from?: string;
    replyTo?: string;
  }): Promise<void>;
}

export const EMAIL_SENDER = Symbol('EmailSender');
