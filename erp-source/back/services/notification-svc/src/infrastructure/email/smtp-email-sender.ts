import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EmailSender } from '../../application/ports/email-sender.port';

@Injectable()
export class SmtpEmailSender implements EmailSender, OnModuleInit {
  private readonly logger = new Logger(SmtpEmailSender.name);
  private transporter: nodemailer.Transporter;
  private readonly fromAddress: string;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('smtp.host', 'localhost');
    const port = this.config.get<number>('smtp.port', 587);
    const secure = this.config.get<boolean>('smtp.secure', false);
    const user = this.config.get<string>('smtp.user', '');
    const pass = this.config.get<string>('smtp.pass', '');
    this.fromAddress = this.config.get<string>('smtp.from', 'noreply@erp.local');

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      ...(user ? { auth: { user, pass } } : {}),
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection verified');
    } catch (err) {
      this.logger.warn(`SMTP verify failed (emails may not send): ${(err as Error).message}`);
    }
  }

  async send(params: {
    to: string;
    subject: string;
    body: string;
    from?: string;
    replyTo?: string;
  }): Promise<void> {
    const info = await this.transporter.sendMail({
      from: params.from || this.fromAddress,
      to: params.to,
      subject: params.subject,
      html: params.body,
      replyTo: params.replyTo,
    });
    this.logger.log(`Email sent to ${params.to} — messageId: ${info.messageId}`);
  }
}
