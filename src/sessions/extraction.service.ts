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
      const prompt = `لطفاً اطلاعات مهم زیر را از این رونوشت جلسه روان‌درمانی استخراج کن و به صورت خلاصه و ساختاریافته ارائه ده:

1. موضوعات اصلی مورد بحث
2. مشکلات و نگرانی‌های بیمار
3. احساسات و عواطف بیان شده
4. پیشنهادات و راهکارهای مطرح شده
5. نکات مهم برای جلسات بعدی

رونوشت:
${transcript}

لطفاً پاسخ را به فارسی و به صورت منظم و قابل استفاده برای پزشک ارائه ده.`;

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

      return extractedData;
    } catch (error) {
      this.logger.error('Error extracting data from transcript:', error);
      throw new Error(`Failed to extract data from transcript: ${error.message}`);
    }
  }
}

