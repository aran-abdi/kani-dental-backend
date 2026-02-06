import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import OpenAI from 'openai';
import { Patient } from '../entities/patient.entity';
import { Session } from '../entities/session.entity';

@Injectable()
export class AIAssistantService {
  private readonly logger = new Logger(AIAssistantService.name);
  private client: OpenAI;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
  ) {
    const apiKey = this.configService.get<string>('GAPGPT_API_KEY') || 'sk-sedKihe5VmqSqLDb45TMoV4hiBeGsc0TAGY112GGl6F0s16d';
    const baseUrl = this.configService.get<string>('GAPGPT_BASE_URL') || 'https://api.gapgpt.app/v1';
    
    if (!apiKey) {
      this.logger.warn('GAPGPT_API_KEY not found in environment variables');
    } else {
      this.client = new OpenAI({
        apiKey: apiKey,
        baseURL: baseUrl,
      });
    }
  }

  async askQuestion(
    question: string,
    patientId: string | undefined,
    clinicId: string,
  ): Promise<string> {
    if (!this.client) {
      throw new Error('GapGPT client not initialized. Please set GAPGPT_API_KEY in environment variables.');
    }

    if (!question || question.trim().length === 0) {
      throw new Error('Question is empty');
    }

    try {
      // Build context from patient data if patientId is provided
      let context = '';
      
      if (patientId) {
        const patient = await this.patientRepository.findOne({
          where: { id: patientId, clinicId },
        });

        if (!patient) {
          throw new NotFoundException('Patient not found');
        }

        // Build patient context
        context += `اطلاعات بیمار:\n`;
        context += `- نام: ${patient.name}\n`;
        context += `- شماره تماس: ${patient.phone}\n`;
        if (patient.birthDate) {
          context += `- تاریخ تولد: ${patient.birthDate}\n`;
        }
        if (patient.lastVisit) {
          context += `- آخرین ویزیت: ${patient.lastVisit.toLocaleDateString('fa-IR')}\n`;
        }

        // Get recent sessions for the patient
        const recentSessions = await this.sessionRepository.find({
          where: { patientId, clinicId },
          order: { createdAt: 'DESC' },
          take: 5, // Get last 5 sessions
        });

        if (recentSessions.length > 0) {
          context += `\nجلسات اخیر:\n`;
          recentSessions.forEach((session, index) => {
            context += `\nجلسه ${index + 1} (${session.createdAt.toLocaleDateString('fa-IR')}):\n`;
            if (session.transcript) {
              context += `- رونوشت: ${session.transcript.substring(0, 200)}${session.transcript.length > 200 ? '...' : ''}\n`;
            }
            if (session.notes) {
              context += `- یادداشت‌ها: ${session.notes}\n`;
            }
          });
        }
      }

      // Build the prompt
      const systemPrompt = `شما یک دستیار هوشمند برای یک کلینیک دندانپزشکی هستید. شما باید به سوالات کاربران در مورد بیماران، جلسات درمانی، و مسائل مربوط به کلینیک پاسخ دهید. پاسخ‌های شما باید:
- دقیق و مفید باشند
- به زبان فارسی و با لحن حرفه‌ای و دوستانه
- در صورت نیاز، از اطلاعات بیمار و جلسات استفاده کنند
- در صورت عدم اطلاع، صادقانه بگویید که اطلاعات کافی ندارید`;

      const userPrompt = context
        ? `${context}\n\nسوال کاربر: ${question}\n\nلطفاً به این سوال پاسخ دهید:`
        : `سوال کاربر: ${question}\n\nلطفاً به این سوال پاسخ دهید:`;

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const answer = response.choices[0]?.message?.content || '';
      
      if (!answer) {
        throw new Error('No answer received from AI');
      }

      return answer;
    } catch (error) {
      this.logger.error('Error asking AI assistant:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to get AI response: ${error.message}`);
    }
  }
}

