import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { TranscriptionService } from './transcription.service';
import { ExtractionService } from './extraction.service';
import { Session } from '../entities/session.entity';
import { Patient } from '../entities/patient.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Session, Patient, User])],
  controllers: [SessionsController],
  providers: [SessionsService, TranscriptionService, ExtractionService],
  exports: [SessionsService, TranscriptionService, ExtractionService],
})
export class SessionsModule {}

