import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Messages } from '../../common/messages/messages';

export class AcceptInvitationDto {
  @ApiProperty({
    example: 'abc123def456...',
    description: 'Invitation token',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    example: 'password123',
    description: 'New password',
  })
  @IsString({ message: Messages.AUTH.NEW_PASSWORD_REQUIRED })
  @IsNotEmpty({ message: Messages.AUTH.NEW_PASSWORD_REQUIRED })
  @MinLength(6, { message: Messages.VALIDATION.PASSWORD_MIN_LENGTH })
  password: string;
}

