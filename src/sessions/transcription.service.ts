import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync, createReadStream } from 'fs';
import { extname, basename } from 'path';
import FormData from 'form-data';
import { fetch } from 'undici';
import { promisify } from 'util';
import { execFile } from 'child_process';
const execAsync = promisify(execFile);
import { existsSync, statSync } from 'fs';

@Injectable()
export class TranscriptionService {
  private readonly logger = new Logger(TranscriptionService.name);
  private apiKey: string;
  private apiEndpoint: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('TRANSCRIPTION_API_KEY') ||
      'eyJhbGciOiJIUzI1NiJ9.eyJzeXN0ZW0iOiJzYWhhYiIsImNyZWF0ZVRpbWUiOiIxNDA0MTExMjE5MzM0NzA4MyIsInVuaXF1ZUZpZWxkcyI6eyJ1c2VybmFtZSI6ImFiNGZiMDI5LWVhMzItNDQxMy05OTI5LTFlNTE1NWZjZDA1NCJ9LCJncm91cE5hbWUiOiI5ZGYxNDNhMGU4OTg1OTc4MTYzMDJkNTkzOTA2ZDUyYyIsImRhdGEiOnsic2VydmljZUlEIjoiNGVkNzY5ZTYtNDgxNC00ZGNiLWEzZWQtZTU1ZWI5Y2FiZjhlIiwicmFuZG9tVGV4dCI6ImN0U1FJIn19._7FgYF9s-h5-tuDn7zL_-prjqogYbBUJGG73TouyUCE';
    // Default to the Ivira Avanegar gateway endpoint (same as working Postman example)
    // Docs: https://api.ivira.ai/partai/avanegar?type=document
    this.apiEndpoint =
      this.configService.get<string>('TRANSCRIPTION_API_ENDPOINT') ||
      'https://partai.gw.isahab.ir/avanegar/v2/avanegar/request';

    if (!this.apiKey) {
      this.logger.warn('TRANSCRIPTION_API_KEY not found in environment variables');
    }
  }

  private async convertToOggIfNeeded(inputPath: string): Promise<{ fileToSend: string, mimeType: string, fileName: string }> {
    const ext = extname(inputPath).toLowerCase();
    let fileToSend = inputPath;
    let mimeType = 'audio/webm; codecs=opus'; // Default
    let fileName = basename(inputPath);

    if (ext === '.webm') {
      const outputPath = inputPath.replace(/\.webm$/i, '.ogg');
      try {
        await execAsync('ffmpeg', [
          '-y', // Overwrite if exists
          '-i', inputPath,
          '-c:a', 'libopus',
          '-b:a', '32k', // Balanced quality
          '-vbr', 'on',
          outputPath,
        ]);
        this.logger.log(`Converted ${inputPath} to ${outputPath}`);
        fileToSend = outputPath;
        mimeType = 'audio/ogg';
        fileName = basename(outputPath);
      } catch (error) {
        this.logger.error('ffmpeg conversion failed, using original file', error);
        // Fallback to original
      }
    }

    // Handle other MIME types as before (your existing code)

    return { fileToSend, mimeType, fileName };
  }

  async transcribeAudio(filePath: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Transcription API key not initialized. Please set TRANSCRIPTION_API_KEY in environment variables.');
    }

    try {

      // Use the original filename - no renaming
      const { fileToSend, mimeType, fileName } = await this.convertToOggIfNeeded(filePath);

      if (!existsSync(fileToSend)) {
        throw new Error(`Audio file not found: ${fileToSend}`);
      }

      const stats = statSync(fileToSend);
      this.logger.log(`Sending file: ${fileToSend} | size: ${stats.size} bytes`);

      if (stats.size < 1000) { // arbitrary small threshold
        throw new Error(`Audio file too small (${stats.size} bytes) - likely empty`);
      }

      this.logger.log(`Starting transcription for file: ${fileName} (${mimeType})`);

      this.logger.log(`File size: ${stats.size} bytes`);

      // Use curl CLI instead of undici.fetch because undici was consistently timing out on headers
      // while the exact same request via curl/Postman succeeds.
      const curlArgs = [
        '-s',
        '-X',
        'POST',
        this.apiEndpoint,
        '-H',
        `gateway-token: ${this.apiKey}`,
        '-H',
        'accept: application/json',
        '-F',
        `audio=@${fileToSend};type=${mimeType};filename=${fileName}`,
        '-F',
        'model=default',
        '-F',
        'srt=false',
        '-F',
        'inverseNormalizer=false',
        '-F',
        'timestamp=false',
        '-F',
        'spokenPunctuation=false',
        '-F',
        'punctuation=false',
        '-F',
        'numSpeakers=0',
        '-F',
        'diarize=true',
        '--max-time',
        '120',
      ];

      this.logger.log(
        `TranscriptionService: invoking curl with args: ${JSON.stringify(curlArgs)}`,
      );

      const result = await new Promise<any>((resolve, reject) => {
        execFile('curl', curlArgs, (error, stdout, stderr) => {
          if (error) {
            this.logger.error(
              `curl transcription error: ${error.message} | stderr: ${stderr?.toString?.()}`,
            );
            return reject(error);
          }

          try {
            const json = JSON.parse(stdout.toString());
            resolve(json);
          } catch (parseError) {
            this.logger.error(
              `Failed to parse transcription response JSON. stdout: ${stdout.toString()}`,
            );
            reject(parseError);
          }
        });
      });

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/cd1d72e5-f815-494e-9f6a-c3f375dc1a8f', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'initial',
          hypothesisId: 'H2',
          location: 'src/sessions/transcription.service.ts:95',
          message: 'TranscriptionService.transcribeAudio response received',
          data: {
            hasData: !!result?.data,
            hasAiResponse: !!result?.data?.data?.aiResponse,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => { });
      // #endregion

      // Extract transcript from response structure: data.data.aiResponse.result.text
      if (result?.data?.data?.aiResponse?.result?.text) {
        const text: string = result.data.data.aiResponse.result.text;

        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/cd1d72e5-f815-494e-9f6a-c3f375dc1a8f', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: 'debug-session',
            runId: 'initial',
            hypothesisId: 'H3',
            location: 'src/sessions/transcription.service.ts:99',
            message: 'TranscriptionService.transcribeAudio main transcript extracted',
            data: { length: text.length },
            timestamp: Date.now(),
          }),
        }).catch(() => { });
        // #endregion

        return text;
      }

      // Fallback: try alternative paths
      if (result?.data?.aiResponse?.result?.text) {
        return result.data.aiResponse.result.text;
      }

      if (result?.aiResponse?.result?.text) {
        return result.aiResponse.result.text;
      }

      // If no text found, log the response and throw
      this.logger.error('Unexpected response structure:', JSON.stringify(result, null, 2));
      throw new Error('Unexpected response structure from transcription API');
    } catch (error) {
      this.logger.error('Error transcribing audio:', error);
      throw new Error(`Failed to transcribe audio: ${error.message}`);
    }
  }
}

