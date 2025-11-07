import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { Messages } from '../../common/messages/messages';

export class LoginDto {
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
    example: 'password123',
    description: 'User password',
  })
  @IsString({ message: Messages.AUTH.PASSWORD_REQUIRED })
  @IsNotEmpty({ message: Messages.AUTH.PASSWORD_REQUIRED })
  password: string;
}

