import { Controller, Get, Query, Param, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WikiService } from './wiki.service';

export class AskAiDto {
  question!: string;
  category?: string;
}

@ApiTags('Knowledge Base & Standards (دانشنامه و استانداردها)')
@Controller('wiki')
export class WikiController {
  constructor(private readonly wikiService: WikiService) {}

  @Get('articles')
  @ApiOperation({ summary: 'List all standard and regulation articles' })
  async getArticles(@Query('category') category?: string) {
    return this.wikiService.getArticles(category);
  }

  @Get('articles/:slug')
  @ApiOperation({ summary: 'Get single article content' })
  async getArticleBySlug(@Param('slug') slug: string) {
    return this.wikiService.getArticleBySlug(slug);
  }

  @Post('ask-ai')
  @ApiOperation({ summary: 'Ask AI questions on Iranian electrical codes & standards' })
  async askAI(@Body() dto: AskAiDto) {
    return this.wikiService.askAI(dto);
  }
}
