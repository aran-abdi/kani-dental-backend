import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class ExtractionService {
  private readonly logger = new Logger(ExtractionService.name);
  private client: OpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GAPGPT_API_KEY');
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

  async extractDataFromTranscript(transcript: string): Promise<string> {
    if (!this.client) {
      throw new Error('GapGPT client not initialized. Please set GAPGPT_API_KEY in environment variables.');
    }

    if (!transcript || transcript.trim().length === 0) {
      throw new Error('Transcript is empty');
    }

    try {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/cd1d72e5-f815-494e-9f6a-c3f375dc1a8f', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'initial',
          hypothesisId: 'H4',
          location: 'src/sessions/extraction.service.ts:34',
          message: 'ExtractionService.extractDataFromTranscript start',
          data: { transcriptLength: transcript.length },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion

      const prompt = `
      تو یک دستیار هوشمند برای مدیریت کلینیک دندان‌پزشکی هستی.  
      لطفاً از رونوشت گفت‌وگوی جلسه دندان‌پزشک و بیمار، اطلاعات بالینی و مدیریتی زیر را به صورت دقیق، خلاصه و ساختاریافته استخراج کن.
      
      خروجی باید فقط به زبان فارسی و در قالب بخش‌های زیر باشد:
      
      1. اطلاعات بیمار (در صورت وجود)
         - نام:
         - سن:
         - جنسیت:
      
      2. شکایت اصلی بیمار (Chief Complaint)
      
      3. وضعیت فعلی بیمار (Current Condition)
         - علائم ذکر شده:
         - محل درد یا مشکل:
         - شدت درد (در صورت ذکر):
      
      4. سابقه پزشکی و دندان‌پزشکی (History)
         - سابقه بیماری‌های مهم:
         - سابقه درمان‌های دندان‌پزشکی:
         - داروهای مصرفی:
         - حساسیت دارویی یا آلرژی:
      
      5. یافته‌های معاینه یا تشخیص ذکر شده توسط پزشک (Assessment / Diagnosis)
      
      6. اقدامات انجام شده یا برنامه درمانی (Treatment Plan)
         - درمان انجام‌شده:
         - درمان پیشنهادی:
         - داروهای تجویز شده:
      
      7. توصیه‌های پزشک به بیمار (Doctor Recommendations)
      
      8. برنامه پیگیری و جلسه بعدی (Follow-up Plan)
      
      9. نکات هشدار یا موارد پرخطر (Risk Flags)
         - عفونت
         - خونریزی شدید
         - درد غیرطبیعی
         - بیماری زمینه‌ای مؤثر
      
      10. پیشنهادات کمکی برای دندان‌پزشک (Clinical Suggestions)
         - اگر اطلاعات ناقص است، چه سوالاتی باید از بیمار پرسیده شود؟
         - چه بررسی‌های تکمیلی ممکن است لازم باشد؟
         - پیشنهادات احتیاطی یا مراقبتی
      
      اگر اطلاعاتی در رونوشت وجود ندارد، به‌صورت «ذکر نشده» بنویس.
      از حدس زدن خودداری کن.
      خروجی باید کاملاً ساختاریافته، رسمی و قابل استفاده در پرونده پزشکی باشد.
      
      رونوشت گفتگو:
      ${transcript}
      `;

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini', // Using mini GPT model for cost-effective text extraction
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const extractedData = response.choices[0]?.message?.content || '';
      
      if (!extractedData) {
        throw new Error('No data extracted from transcript');
      }

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/cd1d72e5-f815-494e-9f6a-c3f375dc1a8f', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'initial',
          hypothesisId: 'H5',
          location: 'src/sessions/extraction.service.ts:59',
          message: 'ExtractionService.extractDataFromTranscript success',
          data: { extractedLength: extractedData.length },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion

      return extractedData;
    } catch (error) {
      this.logger.error('Error extracting data from transcript:', error);
      throw new Error(`Failed to extract data from transcript: ${error.message}`);
    }
  }
}

