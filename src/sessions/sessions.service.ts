import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from '../entities/session.entity';
import { Patient } from '../entities/patient.entity';
import { User } from '../entities/user.entity';
import { TranscriptionService } from './transcription.service';
import { ExtractionService } from './extraction.service';
import { join } from 'path';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private transcriptionService: TranscriptionService,
    private extractionService: ExtractionService,
    private configService: ConfigService,
  ) {}

  async uploadAudio(
    file: any,
    patientId: string,
    userId: string,
    duration?: number,
  ): Promise<{ id: string; url: string; filename: string }> {
    // Verify patient exists
    const patient = await this.patientRepository.findOne({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Verify user exists
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Construct the URL - in production, this should be your CDN or storage service URL
    const baseUrl = this.configService.get<string>('API_BASE_URL') || process.env.API_BASE_URL || 'http://localhost:3000';
    const audioUrl = `${baseUrl}/uploads/sessions/${file.filename}`;

    // Create session record in database
    const session = this.sessionRepository.create({
      patientId,
      userId,
      clinicId: user.clinicId,
      audioUrl,
      filename: file.filename,
      duration: duration || null,
      status: 'processing', // Initial status, can be updated later
    });

    const savedSession = await this.sessionRepository.save(session);

    // Update patient's lastVisit to the current session date
    patient.lastVisit = savedSession.createdAt;
    await this.patientRepository.save(patient);

    // Start transcription in the background (don't wait for it)
    // Construct the full file path
    const filePath = join(process.cwd(), 'uploads', 'sessions', file.filename);
    this.transcribeAudioAsync(savedSession.id, filePath).catch((error) => {
      console.error('Error in background transcription:', error);
    });

    return {
      id: savedSession.id,
      url: audioUrl,
      filename: file.filename,
    };
  }

  private async transcribeAudioAsync(sessionId: string, filePath: string): Promise<void> {
    try {
      // Step 1: Transcribe audio
      const transcript = await this.transcriptionService.transcribeAudio(filePath);
      
      // Update session with transcript
      let session = await this.sessionRepository.findOne({
        where: { id: sessionId },
      });

      if (!session) {
        return;
      }

      session.transcript = transcript;
      session.status = 'extracting'; // Update status to extracting
      await this.sessionRepository.save(session);

      // Step 2: Extract data from transcript
      try {
        const extractedData = await this.extractionService.extractDataFromTranscript(transcript);
        
        // Update session with extracted data and mark as completed
        session.notes = extractedData;
        session.status = 'completed';
        await this.sessionRepository.save(session);
      } catch (extractionError) {
        console.error('Extraction error:', extractionError);
        // If extraction fails, still mark as completed with transcript
        // The transcript is available even if extraction failed
        session.status = 'completed';
        await this.sessionRepository.save(session);
      }
    } catch (error) {
      console.error('Transcription error:', error);
      // Update session status to failed
      const session = await this.sessionRepository.findOne({
        where: { id: sessionId },
      });

      if (session) {
        session.status = 'failed';
        await this.sessionRepository.save(session);
      }
    }
  }

  async getSession(id: string, clinicId: string): Promise<Session> {
    const session = await this.sessionRepository.findOne({
      where: { id, clinicId },
      relations: ['patient', 'user'],
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return session;
  }

  async updateSession(
    id: string,
    clinicId: string,
    updates: {
      transcript?: string;
      notes?: string;
      status?: string;
    },
  ): Promise<Session> {
    const session = await this.sessionRepository.findOne({
      where: { id, clinicId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    Object.assign(session, updates);
    return this.sessionRepository.save(session);
  }

  async deleteSession(id: string, clinicId: string): Promise<void> {
    const result = await this.sessionRepository.delete({ id, clinicId });
    if (result.affected === 0) {
      throw new NotFoundException('Session not found');
    }
  }

  async getSessionsByPatient(patientId: string, clinicId: string): Promise<Session[]> {
    return this.sessionRepository.find({
      where: { patientId, clinicId },
      relations: ['patient', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAllSessions(clinicId: string, limit: number = 10): Promise<Session[]> {
    return this.sessionRepository.find({
      where: { clinicId },
      relations: ['patient', 'user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}

