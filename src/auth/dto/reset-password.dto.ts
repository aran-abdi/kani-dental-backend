import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
import { Messages } from '../../common/messages/messages';

export class ResetPasswordDto {
  @ApiProperty({
    example: '+989123456789',
    description: 'User phone number with +98 prefix',
  })
  @IsString({ message: Messages.AUTH.PHONE_REQUIRED })
  @IsNotEmpty({ message: Messages.AUTH.PHONE_REQUIRED })
  @Matches(/^\+98\d{10}$/, {
    message: Messages.VALIDATION.PHONE_FORMAT,
  })
  phone: string;

  @ApiProperty({
    example: '123456',
    description: 'OTP code received via SMS',
  })
  @IsString({ message: Messages.AUTH.OTP_REQUIRED })
  @IsNotEmpty({ message: Messages.AUTH.OTP_REQUIRED })
  otpCode: string;

  @ApiProperty({
    example: 'newPassword123',
    description: 'New password',
    minLength: 6,
  })
  @IsString({ message: Messages.AUTH.NEW_PASSWORD_REQUIRED })
  @IsNotEmpty({ message: Messages.AUTH.NEW_PASSWORD_REQUIRED })
  @MinLength(6, { message: Messages.VALIDATION.PASSWORD_MIN_LENGTH })
  newPassword: string;
}

