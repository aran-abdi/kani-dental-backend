import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class AskQuestionDto {
  @ApiProperty({
    description: 'The question to ask the AI assistant',
    example: 'آیا این بیمار نیاز به پیگیری دارد؟',
  })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiPropertyOptional({
    description: 'Optional patient ID for context-aware responses',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsOptional()
  patientId?: string;
}

export class AskQuestionResponseDto {
  @ApiProperty({
    description: 'The AI assistant response',
    example: 'بله، این بیمار نیاز به پیگیری دارد...',
  })
  answer: string;
}





