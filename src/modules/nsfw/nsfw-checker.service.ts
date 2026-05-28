// src/modules/nsfw/nsfw-checker.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ResendService } from './resend.service';

@Injectable()
export class NsfwCheckerService {  // ← ASSICURATI CHE CI SIA 'export'
  private readonly logger = new Logger(NsfwCheckerService.name);
  private messageBuffer: Array<{
    from: string;
    chatId: string;
    body: string;
    timestamp: string;
    sessionId?: string;
  }> = [];
  
  private readonly BATCH_SIZE = 100;

  constructor(
    private readonly resendService: ResendService,
  ) {}

  async addToBuffer(messageData: {
    from: string;
    chatId: string;
    body: string;
    sessionId?: string;
  }): Promise<void> {
    this.messageBuffer.push({
      ...messageData,
      timestamp: new Date().toISOString()
    });
    
    this.logger.log(`Buffer: ${this.messageBuffer.length}/${this.BATCH_SIZE}`);
    
    if (this.messageBuffer.length >= this.BATCH_SIZE) {
      await this.flushBuffer();
    }
  }
  
  async flushBuffer(): Promise<void> {
    if (this.messageBuffer.length === 0) return;
    
    const messages = [...this.messageBuffer];
    this.messageBuffer = [];
    
    this.logger.log(`Generazione report batch di ${messages.length} messaggi...`);
    const reportHtml = this.generateAggregatedReport(messages);
    
    await this.resendService.sendBatchReport(reportHtml, messages.length, 0);
    this.logger.log(`✅ Inviato report batch`);
  }
  
  private generateAggregatedReport(messages: any[]): string {
    const messageList = messages.map((msg, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${this.escapeHtml(msg.from)}</td>
        <td>${this.escapeHtml(msg.chatId)}</td>
        <td>${msg.timestamp}</td>
        <td>${this.escapeHtml(msg.body?.substring(0, 100))}</td>
      </tr>
    `).join('');
    
    return `
      <h1>Report Batch WhatsApp</h1>
      <p>Totale messaggi: ${messages.length}</p>
      <table border="1">
        <thead><tr><th>#</th><th>Da</th><th>Chat</th><th>Data</th><th>Testo</th></tr></thead>
        <tbody>${messageList}</tbody>
      </table>
    `;
  }

  private escapeHtml(text: string): string {
    if (!text) return '';
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  getBufferSize(): number {
    return this.messageBuffer.length;
  }
}
