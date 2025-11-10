import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProfileService } from './profile.service';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Ensure uploads directory exists
const uploadsDir = join(process.cwd(), 'uploads', 'avatars');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

@ApiTags('profile')
@ApiBearerAuth()
@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
    type: ProfileResponseDto,
  })
  async getProfile(@Request() req): Promise<ProfileResponseDto> {
    return this.profileService.getProfile(req.user.id);
  }

  @Put()
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: ProfileResponseDto,
  })
  async updateProfile(
    @Request() req,
    @Body() updateDto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    return this.profileService.updateProfile(req.user.id, updateDto);
  }

  @Post('avatar')
  @ApiOperation({ summary: 'Upload user avatar' })
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
    type: ProfileResponseDto,
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadsDir,
        filename: (req, file, cb) => {
          const userId = req.user?.id || 'unknown';
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${userId}-${uniqueSuffix}${ext}`);
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
    @Request() req,
    @UploadedFile() file: any,
  ): Promise<ProfileResponseDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Construct the URL - in production, this should be your CDN or storage service URL
    const baseUrl = this.configService.get<string>('API_BASE_URL') || process.env.API_BASE_URL || 'http://localhost:3000';
    const avatarUrl = `${baseUrl}/uploads/avatars/${file.filename}`;

    return this.profileService.updateAvatar(req.user.id, avatarUrl);
  }

  @Delete('avatar')
  @ApiOperation({ summary: 'Remove user avatar' })
  @ApiResponse({
    status: 200,
    description: 'Avatar removed successfully',
    type: ProfileResponseDto,
  })
  async removeAvatar(@Request() req): Promise<ProfileResponseDto> {
    return this.profileService.removeAvatar(req.user.id);
  }
}

