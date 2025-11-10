import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { readFileSync } from 'fs';
import { extname } from 'path';
import { Blob } from 'buffer';

@Injectable()
export class TranscriptionService {
  private readonly logger = new Logger(TranscriptionService.name);
  private client: ElevenLabsClient;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('ELEVENLABS_API_KEY');
    if (!apiKey) {
      this.logger.warn('ELEVENLABS_API_KEY not found in environment variables');
    } else {
      this.client = new ElevenLabsClient({
        apiKey: apiKey,
      });
    }
  }

  async transcribeAudio(filePath: string): Promise<string> {
    if (!this.client) {
      throw new Error('ElevenLabs client not initialized. Please set ELEVENLABS_API_KEY in environment variables.');
    }

    try {
      // Read the audio file as a buffer
      const audioBuffer = readFileSync(filePath);

      // Determine MIME type based on file extension
      const ext = extname(filePath).toLowerCase().slice(1); // Remove the dot
      let mimeType = 'audio/webm'; // Default to webm
      if (ext === 'mp3') mimeType = 'audio/mpeg';
      else if (ext === 'wav') mimeType = 'audio/wav';
      else if (ext === 'ogg') mimeType = 'audio/ogg';
      else if (ext === 'm4a') mimeType = 'audio/mp4';
      else if (ext === 'aac') mimeType = 'audio/aac';
      else if (ext === 'flac') mimeType = 'audio/flac';
      else if (ext === 'opus') mimeType = 'audio/opus';
      else if (ext === 'webm') mimeType = 'audio/webm';

      // Create a Blob from the buffer with appropriate MIME type
      const audioBlob = new Blob([audioBuffer], { type: mimeType });

      // Call ElevenLabs Speech-to-Text API
      const transcription = await this.client.speechToText.convert({
        file: audioBlob,
        modelId: 'scribe_v1',
        languageCode: 'fa', // Persian/Farsi
        tagAudioEvents: false,
        diarize: false, // Set to true if you want speaker diarization
      });

      // The response structure may vary - check if it's a string or has a text property
      if (typeof transcription === 'string') {
        return transcription;
      }
      
      // Check for different possible response structures
      if ('text' in transcription) {
        return (transcription as any).text || '';
      }
      
      // If it's a multichannel response, extract text from segments
      if ('segments' in transcription && Array.isArray((transcription as any).segments)) {
        const segments = (transcription as any).segments;
        return segments.map((s: any) => s.text || '').join(' ');
      }
      
      // Fallback: try to stringify and return
      return JSON.stringify(transcription);
    } catch (error) {
      this.logger.error('Error transcribing audio:', error);
      throw new Error(`Failed to transcribe audio: ${error.message}`);
    }
  }
}

