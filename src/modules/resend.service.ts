// src/modules/nsfw/services/resend.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class ResendService {
  private readonly resend: Resend;
  private readonly logger = new Logger(ResendService.name);

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendAlert(messageData: any, isNsfw: boolean): Promise<void> {
    const subject = isNsfw ? '🚨 NSFW Alert: Messaggio WhatsApp' : 'ℹ️ Report di moderazione WhatsApp';
    const type = isNsfw ? 'NSFW' : 'SAFE';

    try {
      await this.resend.emails.send({
        from: 'WhatsApp Monitor <onboarding@resend.dev>',
        to: [process.env.NSFW_REPORT_EMAIL],
        subject,
        html: `
          <h1>Report Messaggio WhatsApp</h1>
          <p><strong>Classificazione:</strong> ${type}</p>
          <p><strong>Da:</strong> ${messageData.from}</p>
          <p><strong>Chat:</strong> ${messageData.chatId}</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p><strong>Messaggio:</strong></p>
          <blockquote>${messageData.body}</blockquote>
        `,
      });
      this.logger.log(`Alert email inviata per messaggio ${isNsfw ? 'NSFW' : 'SAFE'} da ${messageData.from}`);
    } catch (error) {
      this.logger.error(`Errore invio email: ${error.message}`, error.stack);
    }
  }
}
