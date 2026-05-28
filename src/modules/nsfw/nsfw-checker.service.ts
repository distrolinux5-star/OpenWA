// src/modules/nsfw/nsfw-checker.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ResendService } from './resend.service';

@Injectable()
export class NsfwCheckerService {
  private readonly logger = new Logger(NsfwCheckerService.name);
  private nsfwBuffer: Array<{
    from: string;
    chatId: string;
    body: string;
    timestamp: string;
    sessionId?: string;
  }> = [];
  
  private readonly BATCH_SIZE = 100; // 100 messaggi come richiesto

  constructor(
    private readonly resendService: ResendService,
  ) {}

  async addToBuffer(messageData: {
    from: string;
    chatId: string;
    body: string;
    sessionId?: string;
  }): Promise<void> {
    // Aggiungi il messaggio al buffer
    this.nsfwBuffer.push({
      ...messageData,
      timestamp: new Date().toISOString()
    });
    
    this.logger.log(`Buffer NSFW: ${this.nsfwBuffer.length}/${this.BATCH_SIZE} messaggi | Chat: ${messageData.chatId}`);
    
    // Se raggiunto il limite di 100 messaggi, invia il report aggregato
    if (this.nsfwBuffer.length >= this.BATCH_SIZE) {
      await this.flushBuffer();
    }
  }
  
  async flushBuffer(): Promise<void> {
    if (this.nsfwBuffer.length === 0) return;
    
    const messages = [...this.nsfwBuffer];
    const messageCount = messages.length;
    
    // Svuota il buffer
    this.nsfwBuffer = [];
    
    this.logger.log(`Generazione report batch di ${messageCount} messaggi NSFW...`);
    
    // Genera il report aggregato
    const reportHtml = this.generateAggregatedReport(messages);
    
    // Invia l'email
    await this.resendService.sendBatchReport(reportHtml, messageCount);
    
    this.logger.log(`✅ Inviato report batch di ${messageCount} messaggi NSFW`);
  }
  
  private generateAggregatedReport(messages: any[]): string {
    // Calcola statistiche
    const uniqueChats = new Set(messages.map(m => m.chatId)).size;
    const uniqueUsers = new Set(messages.map(m => m.from)).size;
    
    const messageList = messages.map((msg, idx) => `
      <tr style="border-bottom: 1px solid #ddd;">
        <td style="padding: 8px; text-align: center;">${idx + 1}</td>
        <td style="padding: 8px;">${this.escapeHtml(msg.from || 'sconosciuto')}</td>
        <td style="padding: 8px;">${this.escapeHtml(msg.chatId || 'sconosciuto')}</td>
        <td style="padding: 8px; font-size: 12px;">${new Date(msg.timestamp).toLocaleString()}</td>
        <td style="padding: 8px; max-width: 300px; word-wrap: break-word;">
          ${this.escapeHtml(msg.body?.substring(0, 150))}${msg.body?.length > 150 ? '...' : ''}
        </td>
      </tr>
    `).join('');
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Report NSFW Batch</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #d32f2f; }
          .stats { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .stats p { margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #333; color: white; padding: 10px; text-align: left; }
          td { padding: 8px; border-bottom: 1px solid #ddd; }
          .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
        </style>
      </head>
      <body>
        <h1>🚨 Report NSFW - Batch di ${messages.length} messaggi</h1>
        
        <div class="stats">
          <p><strong>📊 Statistiche:</strong></p>
          <p>• Totale messaggi NSFW: <strong>${messages.length}</strong></p>
          <p>• Chat/Gruppi coinvolti: <strong>${uniqueChats}</strong></p>
          <p>• Utenti coinvolti: <strong>${uniqueUsers}</strong></p>
          <p>• Periodo: ${messages[0]?.timestamp} - ${messages[messages.length-1]?.timestamp}</p>
        </div>
        
        <h3>📋 Dettaglio messaggi</h3>
        <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%;">
          <thead>
            <tr style="background: #333; color: white;">
              <th>#</th><th>Mittente</th><th>Chat/Gruppo</th><th>Timestamp</th><th>Messaggio</th>
            </tr>
          </thead>
          <tbody>
            ${messageList}
          </tbody>
        </table>
        
        <div class="footer">
          <p>Report generato automaticamente da OpenWA - Sistema di moderazione WhatsApp</p>
        </div>
      </body>
      </html>
    `;
  }

  private escapeHtml(text: string): string {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  getBufferSize(): number {
    return this.nsfwBuffer.length;
  }
}
