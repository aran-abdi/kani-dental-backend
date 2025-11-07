import { ApiProperty } from '@nestjs/swagger';

export class AccountInfoDto {
  @ApiProperty({
    example: '2026-03-19',
    description: 'Account expiry date',
    required: false,
  })
  expiryDate?: string;

  @ApiProperty({
    example: 45,
    description: 'Days until account expiry',
    required: false,
  })
  daysUntilExpiry?: number;
}

export class DeleteAccountRequestDto {
  @ApiProperty({
    example: 'I want to delete my account',
    description: 'Reason for account deletion',
    required: false,
  })
  reason?: string;
}

export class DeleteAccountResponseDto {
  @ApiProperty({
    example: 'Account deletion request submitted successfully',
    description: 'Success message',
  })
  message: string;
}

