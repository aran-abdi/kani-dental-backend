import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientResponseDto } from './dto/patient-response.dto';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Ensure uploads directory exists
const uploadsDir = join(process.cwd(), 'uploads', 'patients');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

@ApiTags('patients')
@ApiBearerAuth()
@Controller('patients')
@UseGuards(JwtAuthGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new patient' })
  @ApiResponse({
    status: 201,
    description: 'Patient created successfully',
    type: PatientResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Patient with this phone number already exists in this clinic',
  })
  async create(
    @Request() req,
    @Body() createDto: CreatePatientDto,
  ): Promise<PatientResponseDto> {
    return this.patientsService.create(req.user.clinicId, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all patients for the clinic' })
  @ApiResponse({
    status: 200,
    description: 'List of patients',
    type: [PatientResponseDto],
  })
  async findAll(@Request() req): Promise<PatientResponseDto[]> {
    return this.patientsService.findAll(req.user.clinicId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a patient by ID' })
  @ApiResponse({
    status: 200,
    description: 'Patient details',
    type: PatientResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Patient not found',
  })
  async findOne(
    @Param('id') id: string,
    @Request() req,
  ): Promise<PatientResponseDto> {
    return this.patientsService.findOne(id, req.user.clinicId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a patient' })
  @ApiResponse({
    status: 200,
    description: 'Patient updated successfully',
    type: PatientResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Patient not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Patient with this phone number already exists in this clinic',
  })
  async update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateDto: UpdatePatientDto,
  ): Promise<PatientResponseDto> {
    return this.patientsService.update(id, req.user.clinicId, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a patient' })
  @ApiResponse({
    status: 200,
    description: 'Patient deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Patient not found',
  })
  async remove(
    @Param('id') id: string,
    @Request() req,
  ): Promise<{ message: string }> {
    await this.patientsService.remove(id, req.user.clinicId);
    return { message: 'Patient deleted successfully' };
  }

  @Post(':id/avatar')
  @ApiOperation({ summary: 'Upload patient avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Avatar uploaded successfully',
    type: PatientResponseDto,
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadsDir,
        filename: (req, file, cb) => {
          const patientId = req.params?.id || 'unknown';
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${patientId}-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return cb(
            new BadRequestException('Only image files are allowed'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadAvatar(
    @Param('id') id: string,
    @Request() req,
    @UploadedFile() file: any,
  ): Promise<PatientResponseDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Construct the URL - in production, this should be your CDN or storage service URL
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    const avatarUrl = `${baseUrl}/uploads/patients/${file.filename}`;

    return this.patientsService.updateAvatar(id, req.user.clinicId, avatarUrl);
  }

  @Delete(':id/avatar')
  @ApiOperation({ summary: 'Remove patient avatar' })
  @ApiResponse({
    status: 200,
    description: 'Avatar removed successfully',
    type: PatientResponseDto,
  })
  async removeAvatar(
    @Param('id') id: string,
    @Request() req,
  ): Promise<PatientResponseDto> {
    return this.patientsService.removeAvatar(id, req.user.clinicId);
  }
}

