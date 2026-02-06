import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AIAssistantController } from './ai-assistant.controller';
import { AIAssistantService } from './ai-assistant.service';
import { Patient } from '../entities/patient.entity';
import { Session } from '../entities/session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Patient, Session])],
  controllers: [AIAssistantController],
  providers: [AIAssistantService],
  exports: [AIAssistantService],
})
export class AIAssistantModule {}


