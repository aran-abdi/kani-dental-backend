import { ApiProperty } from '@nestjs/swagger';

export class OtpResponseDto {
  @ApiProperty({
    example: '123456',
    description: 'OTP code (only returned in development/mock mode)',
  })
  otpCode: string;

  @ApiProperty({
    example: 'OTP sent successfully',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({
    example: 300,
    description: 'OTP expiration time in seconds',
  })
  expiresIn: number;
}

