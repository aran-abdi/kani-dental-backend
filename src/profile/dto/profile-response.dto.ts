import { ApiProperty } from '@nestjs/swagger';
import { ClinicRole } from '../../common/enums/clinic-role.enum';

export class ProfileResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'User ID',
  })
  id: string;

  @ApiProperty({
    example: '+989123456789',
    description: 'User phone number',
  })
  phone: string;

  @ApiProperty({
    example: 'John',
    description: 'User first name',
    required: false,
  })
  firstName?: string;

  @ApiProperty({
    example: 'Doe',
    description: 'User last name',
    required: false,
  })
  lastName?: string;

  @ApiProperty({
    example: 'Doctor',
    description: 'User role',
    enum: ClinicRole,
  })
  role: ClinicRole;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174001',
    description: 'Clinic ID',
  })
  clinicId: string;

  @ApiProperty({
    example: {
      id: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Kani Dental Clinic',
    },
    description: 'Clinic information',
    required: false,
  })
  clinic?: {
    id: string;
    name: string;
  } | null;

  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    description: 'Avatar URL',
    required: false,
  })
  avatarUrl?: string | null;
}

