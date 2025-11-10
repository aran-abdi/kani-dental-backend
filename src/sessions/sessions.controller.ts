import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SessionsService } from './sessions.service';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Ensure uploads directory exists
const uploadsDir = join(process.cwd(), 'uploads', 'sessions');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

@ApiTags('sessions')
@ApiBearerAuth()
@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post('upload-audio')
  @ApiOperation({ summary: 'Upload audio file for session' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        patientId: {
          type: 'string',
          description: 'Patient ID',
        },
        duration: {
          type: 'number',
          description: 'Recording duration in seconds (optional)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Audio uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        url: { type: 'string' },
        filename: { type: 'string' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadsDir,
      filename: (req, file, cb) => {
        const userId = req.user?.id || 'unknown';
        const patientId = req.body?.patientId || 'unknown';
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        const filename = `${userId}-${patientId}-${uniqueSuffix}${ext}`;
        cb(null, filename);
      },
      }),
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB for audio files
      },
      fileFilter: (req, file, cb) => {
        // Accept audio files - check mimetype and extension
        const isAudioMimeType = file.mimetype.startsWith('audio/') || 
                               file.mimetype === 'video/webm'; // Some browsers report webm as video/webm
        const isAudioExtension = /\.(webm|mp3|wav|ogg|m4a|aac|flac|opus)$/i.test(file.originalname);
        
        if (!isAudioMimeType && !isAudioExtension) {
          return cb(
            new BadRequestException('Only audio files are allowed (supported formats: mp3, wav, webm, ogg, m4a, aac, flac, opus)'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadAudio(
    @Request() req,
    @UploadedFile() file: any,
    @Body('patientId') patientId: string,
    @Body('duration') duration?: number,
  ): Promise<{ id: string; url: string; filename: string }> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!patientId) {
      throw new BadRequestException('Patient ID is required');
    }

    return this.sessionsService.uploadAudio(
      file,
      patientId,
      req.user.id,
      duration ? parseInt(duration.toString(), 10) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get session by ID' })
  @ApiResponse({
    status: 200,
    description: 'Session details',
  })
  async getSession(@Param('id') id: string, @Request() req) {
    return this.sessionsService.getSession(id, req.user.clinicId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update session (transcript, notes, status)' })
  @ApiResponse({
    status: 200,
    description: 'Session updated successfully',
  })
  async updateSession(
    @Param('id') id: string,
    @Request() req,
    @Body() updates: { transcript?: string; notes?: string; status?: string },
  ) {
    return this.sessionsService.updateSession(id, req.user.clinicId, updates);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete session' })
  @ApiResponse({
    status: 200,
    description: 'Session deleted successfully',
  })
  async deleteSession(@Param('id') id: string, @Request() req) {
    await this.sessionsService.deleteSession(id, req.user.clinicId);
    return { message: 'Session deleted successfully' };
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Get all sessions for a patient' })
  @ApiResponse({
    status: 200,
    description: 'List of sessions',
  })
  async getSessionsByPatient(@Param('patientId') patientId: string, @Request() req) {
    return this.sessionsService.getSessionsByPatient(patientId, req.user.clinicId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sessions for the clinic' })
  @ApiResponse({
    status: 200,
    description: 'List of sessions',
  })
  async getAllSessions(@Request() req, @Query('limit') limit?: number) {
    return this.sessionsService.getAllSessions(req.user.clinicId, limit ? parseInt(limit.toString(), 10) : 10);
  }
}

