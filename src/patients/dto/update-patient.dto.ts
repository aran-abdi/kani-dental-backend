import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, Matches, MaxLength } from 'class-validator';

export class UpdatePatientDto {
  @ApiProperty({
    example: 'علی احمدی',
    description: 'Patient full name',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiProperty({
    example: '09123456789',
    description: 'Patient phone number',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^09\d{9}$/, {
    message: 'Phone number must be in format 09XXXXXXXXX',
  })
  phone?: string;

  @ApiProperty({
    example: '1370-05-15',
    description: 'Patient birth date in Jalali format (YYYY-MM-DD)',
    required: false,
  })
  @IsOptional()
  @IsString()
  birthDate?: string;
}

