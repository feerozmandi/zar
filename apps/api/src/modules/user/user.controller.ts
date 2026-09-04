import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserService } from './user.service';
import { AIProvider } from '@xennic/shared';

export class UpdateAISettingsDto {
  provider!: AIProvider;
  apiKey!: string; // Plain API key to be encrypted server-side with AES-256-GCM
  preferredModel?: string;
}

@ApiTags('User & AI Settings (BYOK)')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile and active subscriptions' })
  async getProfile() {
    return this.userService.getProfile();
  }

  @Post('ai-settings')
  @ApiOperation({ summary: 'Store encrypted BYOK API Key (AES-256-GCM)' })
  @ApiResponse({ status: 200, description: 'AI Settings encrypted and saved' })
  async updateAISettings(@Body() dto: UpdateAISettingsDto) {
    return this.userService.saveAISettings(dto);
  }
}
