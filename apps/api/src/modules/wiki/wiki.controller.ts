import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { articleSearchSchema, askAiSchema, type AskAiInput, type WikiSearchInput } from "@xennic/shared";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator.js";
import { Public } from "../../common/decorators/roles.decorator.js";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import { WikiService } from "./wiki.service.js";

@ApiTags("wiki")
@Controller("wiki")
export class WikiController {
  public constructor(private readonly wiki: WikiService) {}

  @Get("articles")
  @Public()
  @ApiOperation({ summary: "فهرست مقالات و استانداردها" })
  public articles(@Query(new ZodValidationPipe(articleSearchSchema)) query: WikiSearchInput) {
    return this.wiki.articles(query.page, query.pageSize, query.source);
  }

  @Get("search")
  @Public()
  @ApiOperation({ summary: "جستجوی هوشمند در قوانین و آیین‌نامه‌ها" })
  public search(@Query("q") q = "", @Query("take") take = "20") {
    return this.wiki.search(q, Number(take) || 20);
  }

  @Get(":slug")
  @Public()
  @ApiOperation({ summary: "مشاهده‌ی یک مقاله بر اساس slug" })
  public bySlug(@Param("slug") slug: string) {
    return this.wiki.bySlug(slug);
  }

  @Post("ask-ai")
  @ApiOperation({ summary: "پرسش و پاسخ تخصصی مبتنی بر AI روی قوانین" })
  public ask(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(askAiSchema)) body: AskAiInput,
  ) {
    return this.wiki.askAi(user.id, body.question, body.articleIds, body.model, body.temperature);
  }
}
