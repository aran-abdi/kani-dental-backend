import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, MaxLength, Matches } from 'class-validator';
import { ClinicRole } from '../../common/enums/clinic-role.enum';
import { Messages } from '../../common/messages/messages';

export class ClinicMemberDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Member ID',
  })
  id: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Member full name',
  })
  name: string;

  @ApiProperty({
    example: '+989123456789',
    description: 'Member phone number',
  })
  phone: string;

  @ApiProperty({
    example: 'Doctor',
    description: 'Member role',
    enum: ClinicRole,
  })
  role: ClinicRole;

  @ApiProperty({
    example: true,
    description: 'Whether the member is active',
  })
  isActive: boolean;

  @ApiProperty({
    example: 'abc123def456...',
    description: 'Invitation token (only for inactive members)',
    required: false,
  })
  invitationToken?: string;
}

export class CreateClinicMemberDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Member full name',
  })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({
    example: '+989123456789',
    description: 'Member phone number with +98 prefix',
  })
  @IsString({ message: Messages.AUTH.PHONE_REQUIRED })
  @Matches(/^\+98\d{10}$/, {
    message: Messages.VALIDATION.PHONE_FORMAT,
  })
  phone: string;

  @ApiProperty({
    example: 'Doctor',
    description: 'Member role',
    enum: ClinicRole,
  })
  @IsEnum(ClinicRole)
  role: ClinicRole;
}

export class UpdateClinicMemberDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Member full name',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiProperty({
    example: '+989123456789',
    description: 'Member phone number',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({
    example: 'Doctor',
    description: 'Member role',
    enum: ClinicRole,
    required: false,
  })
  @IsOptional()
  @IsEnum(ClinicRole)
  role?: ClinicRole;

  @ApiProperty({
    example: true,
    description: 'Whether the member is active',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

