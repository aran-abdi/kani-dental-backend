import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { User } from '../entities/user.entity';
import { Clinic } from '../entities/clinic.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Clinic])],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}

