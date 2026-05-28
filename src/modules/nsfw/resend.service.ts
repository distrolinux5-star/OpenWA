// src/modules/nsfw/resend.service.ts
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
    const reportEmail = process.env.NSFW_REPORT_EMAIL;
    
    if (!reportEmail) {
      this.logger.error('NSFW_REPORT_EMAIL non configurata');
      return;
    }

    const subject = isNsfw ? '🚨 NSFW Alert: Messaggio WhatsApp' : 'ℹ️ Report di moderazione WhatsApp';

    try {
      await this.resend.emails.send({
        from: 'WhatsApp Monitor <onboarding@resend.dev>',
        to: [reportEmail],
        subject,
        html: `
          <h1>Report Messaggio WhatsApp</h1>
          <p><strong>Da:</strong> ${messageData.from || 'sconosciuto'}</p>
          <p><strong>Chat:</strong> ${messageData.chatId || 'sconosciuto'}</p>
          <p><strong>Messaggio:</strong></p>
          <blockquote>${messageData.body || 'testo vuoto'}</blockquote>
        `,
      });
      this.logger.log(`Alert email inviata`);
    } catch (error) {
      this.logger.error(`Errore invio email: ${error.message}`);
    }
  }

  async sendBatchReport(htmlContent: string, messageCount: number, nsfwCount?: number): Promise<void> {
    const reportEmail = process.env.NSFW_REPORT_EMAIL;
    
    if (!reportEmail) {
      this.logger.error('NSFW_REPORT_EMAIL non configurata');
      return;
    }

    const subject = nsfwCount !== undefined 
      ? `📊 Report Batch - ${messageCount} msg (${nsfwCount} NSFW)`
      : `📊 Report Batch - ${messageCount} messaggi`;

    try {
      await this.resend.emails.send({
        from: 'WhatsApp Monitor <onboarding@resend.dev>',
        to: [reportEmail],
        subject,
        html: htmlContent,
      });
      this.logger.log(`Batch report inviato: ${messageCount} messaggi`);
    } catch (error) {
      this.logger.error(`Errore invio batch report: ${error.message}`);
    }
  }
}
