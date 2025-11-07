import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'OTP code received via email',
  })
  @IsString()
  @IsNotEmpty()
  otpCode: string;

  @ApiProperty({
    example: 'newPassword123',
    description: 'New password',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}

