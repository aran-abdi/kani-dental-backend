import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, Length } from 'class-validator';
import { Messages } from '../../common/messages/messages';

export class VerifyOtpDto {
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
  @Length(6, 6, { message: Messages.VALIDATION.OTP_LENGTH })
  otpCode: string;
}

