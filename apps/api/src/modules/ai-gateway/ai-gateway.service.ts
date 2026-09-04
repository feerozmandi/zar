import { Injectable, BadRequestException } from '@nestjs/common';
import { AIModelInfo } from '@xennic/shared';
import { GenerateAiDto } from './ai-gateway.controller';

@Injectable()
export class AiGatewayService {
  private readonly availableModels: AIModelInfo[] = [
    {
      id: 'gpt-4o',
      name: 'GPT-4o (GitHub Models / Free Tier)',
      provider: 'GITHUB_MODELS',
      contextWindow: 128000,
      isFreeTier: true,
      requiresBYOK: false,
    },
    {
      id: 'claude-3-5-sonnet',
      name: 'Claude 3.5 Sonnet (Pro BYOK)',
      provider: 'ANTHROPIC',
      contextWindow: 200000,
      isFreeTier: false,
      requiresBYOK: true,
    },
    {
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro (Pro BYOK)',
      provider: 'GEMINI',
      contextWindow: 1000000,
      isFreeTier: false,
      requiresBYOK: true,
    },
    {
      id: 'llama-3.3-70b',
      name: 'Llama 3.3 70B (GitHub Models)',
      provider: 'GITHUB_MODELS',
      contextWindow: 128000,
      isFreeTier: true,
      requiresBYOK: false,
    },
  ];

  getAvailableModels(): AIModelInfo[] {
    return this.availableModels;
  }

  async generateResponse(dto: GenerateAiDto) {
    if (!dto.prompt || dto.prompt.trim().length === 0) {
      throw new BadRequestException('متن درخواست (Prompt) الزامی است');
    }

    const modelId = dto.modelId || 'gpt-4o';
    const provider = dto.provider || 'GITHUB_MODELS';

    // System specialized context for Iranian energy & electrical engineering
    const simulatedAnalysis = `[تحلیل هوش مصنوعی Xennic - مدل: ${modelId} (${provider})]\n\nدر رابطه با درخواست مطرح‌شده:\n۱. بهینه‌سازی بار و مصرف انرژی بر مبنای ساعات کم‌باری و کاهش بار پیک.\n۲. ارزیابی هماهنگی تلفات با استانداردهای توانیر.\n۳. پیشنهاد استفاده از بانک‌های خازنی اتوماتیک مجهز به فیلتر هارمونیک برای جبران‌سازی دقیق توان راکتیو.`;

    return {
      provider,
      modelId,
      outputText: simulatedAnalysis,
      promptTokens: Math.ceil(dto.prompt.length / 4),
      completionTokens: Math.ceil(simulatedAnalysis.length / 4),
      executionTimeMs: 420,
    };
  }
}
