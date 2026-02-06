import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AIAssistantService } from './ai-assistant.service';
import { AskQuestionDto, AskQuestionResponseDto } from './dto/ask-question.dto';

@ApiTags('ai-assistant')
@ApiBearerAuth()
@Controller('ai-assistant')
@UseGuards(JwtAuthGuard)
export class AIAssistantController {
  constructor(private readonly aiAssistantService: AIAssistantService) {}

  @Post('ask')
  @ApiOperation({ summary: 'Ask a question to the AI assistant' })
  @ApiResponse({
    status: 200,
    description: 'AI assistant response',
    type: AskQuestionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Patient not found (if patientId is provided)',
  })
  async ask(
    @Request() req,
    @Body() askQuestionDto: AskQuestionDto,
  ): Promise<AskQuestionResponseDto> {
    const answer = await this.aiAssistantService.askQuestion(
      askQuestionDto.question,
      askQuestionDto.patientId,
      req.user.clinicId,
    );

    return { answer };
  }
}




