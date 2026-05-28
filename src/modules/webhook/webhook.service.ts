// src/modules/webhook/webhook.service.ts
import { GroqService } from '../nsfw/services/groq.service';
import { ResendService } from '../nsfw/services/resend.service';

@Injectable()
export class WebhookService {
  constructor(
    // ... altri servizi
    private readonly groqService: GroqService,
    private readonly resendService: ResendService,
  ) {}

  // Trova il metodo che processa un messaggio in arrivo, simile a questo:
  async processIncomingMessage(payload: any): Promise<void> {
    // 1. Estrai i dati del messaggio
    const messageData = {
      from: payload.from,
      chatId: payload.chatId,
      body: payload.body || payload.caption || ''
    };

    // 2. Se c'è un testo da analizzare
    if (messageData.body) {
      const isNsfw = await this.groqService.checkNSFW(messageData.body);
      
      if (isNsfw) {
        // 3. Se è NSFW, invia una mail di alert
        await this.resendService.sendAlert(messageData, true);
        // Opzionale: aggiungi qui logica per bloccare o segnalare il messaggio
      } else {
        // Opzionale: invia comunque un report (commenta questa riga se non serve)
        // await this.resendService.sendAlert(messageData, false);
      }
    }

    // 4. Procedi con l'invio del webhook verso i tuoi endpoint esterni (se configurati)
    // ... il resto del codice originale di OpenWA ...
  }
}
