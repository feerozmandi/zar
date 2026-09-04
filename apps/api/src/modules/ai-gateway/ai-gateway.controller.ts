import { Controller, Post, Get, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AiGatewayService } from './ai-gateway.service';
import { AIProvider } from '@xennic/shared';

export class GenerateAiDto {
  prompt!: string;
  provider?: AIProvider;
  modelId?: string;
  userApiKey?: string; // Optional BYOK override
}

@ApiTags('Multi-Model AI Gateway (درگاه چندمدلی هوش مصنوعی)')
@Controller('ai')
export class AiGatewayController {
  constructor(private readonly aiService: AiGatewayService) {}

  @Get('models')
  @ApiOperation({ summary: 'List available AI models and supported tiers' })
  async getModels() {
    return this.aiService.getAvailableModels();
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate specialized engineering advice or analysis' })
  @ApiResponse({ status: 200, description: 'AI generation successful' })
  async generate(@Body() dto: GenerateAiDto) {
    return this.aiService.generateResponse(dto);
  }
}
