// src/modules/nsfw/services/groq.service.ts
import { Injectable, Logger } from '@nestjs/common';
import Groq from 'groq-sdk';

@Injectable()
export class GroqService {
  private readonly groq: Groq;
  private readonly logger = new Logger(GroqService.name);

  constructor() {
    this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }

  async checkNSFW(text: string): Promise<boolean> {
    try {
      const response = await this.groq.chat.completions.create({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "system",
            content: `Sei un assistente per la moderazione di contenuti su WhatsApp...
                       Rispondi SOLO e UNICAMENTE con una delle due parole: 'NSFW' o 'SAFE'.`,
          },
          { role: "user", content: text },
        ],
        temperature: 0.5,
      });

      const classification = response.choices[0]?.message?.content?.trim();
      this.logger.log(`Classificazione ricevuta: ${classification} per testo: "${text}"`);
      return classification === 'NSFW';
    } catch (error) {
      this.logger.error(`Errore durante la chiamata a Groq: ${error.message}`, error.stack);
      return false; // In caso di errore, per sicurezza, non bloccare
    }
  }
}
