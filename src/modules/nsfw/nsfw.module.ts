// src/modules/nsfw/nsfw.module.ts
import { Module } from '@nestjs/common';
import { GroqService } from './groq.service';
import { ResendService } from './resend.service';
import { NsfwCheckerService } from './nsfw-checker.service';

@Module({
  providers: [GroqService, ResendService, NsfwCheckerService],
  exports: [GroqService, ResendService, NsfwCheckerService],
})
export class NsfwModule {}
