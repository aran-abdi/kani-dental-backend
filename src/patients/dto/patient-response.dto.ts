import { ApiProperty } from '@nestjs/swagger';

export class PatientResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Patient ID',
  })
  id: string;

  @ApiProperty({
    example: 'علی احمدی',
    description: 'Patient full name',
  })
  name: string;

  @ApiProperty({
    example: '09123456789',
    description: 'Patient phone number',
  })
  phone: string;

  @ApiProperty({
    example: '1370-05-15',
    description: 'Patient birth date in Jalali format (YYYY-MM-DD)',
    required: false,
  })
  birthDate?: string | null;

  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    description: 'Patient avatar URL',
    required: false,
  })
  avatarUrl?: string | null;

  @ApiProperty({
    example: '2024-01-10T00:00:00.000Z',
    description: 'Patient creation date',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-11-05T00:00:00.000Z',
    description: 'Patient last update date',
  })
  updatedAt: Date;

  @ApiProperty({
    example: '2024-11-05T00:00:00.000Z',
    description: 'Last visit date (from sessions)',
    required: false,
  })
  lastVisit?: Date | null;
}

