import { ApiProperty } from '@nestjs/swagger';
import { ClinicRole } from '../../common/enums/clinic-role.enum';

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token',
  })
  accessToken: string;

  @ApiProperty({
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      phone: '+989123456789',
      firstName: 'John',
      lastName: 'Doe',
      clinicId: '123e4567-e89b-12d3-a456-426614174001',
      role: 'Doctor',
      clinic: {
        id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Kani Dental Clinic',
      },
    },
    description: 'User information',
  })
  user: {
    id: string;
    phone: string;
    firstName?: string;
    lastName?: string;
    clinicId: string;
    role: ClinicRole;
    clinic: {
      id: string;
      name: string;
    } | null;
  };
}

