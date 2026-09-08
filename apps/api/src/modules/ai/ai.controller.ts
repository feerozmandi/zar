import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import {
  aiCompareSchema,
  aiGenerateSchema,
  paginationSchema,
  type AiCompareInput,
  type AiGenerateInput,
  type Pagination,
} from "@xennic/shared";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator.js";
import { Public } from "../../common/decorators/roles.decorator.js";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import { ApiBodyZod } from "../../common/utils/zod-openapi.js";
import { AiService } from "./ai.service.js";

@ApiTags("ai")
@Controller("ai")
export class AiController {
  public constructor(private readonly ai: AiService) {}

  @Get("models")
  @Public()
  @ApiOperation({ summary: "فهرست مدل‌های فعال دروازه" })
  public models() {
    return this.ai.models();
  }

  @Post("generate")
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "ارسال پرامپت به مدل انتخابی (GitHub Models یا کلید کاربر)" })
  @ApiBodyZod(aiGenerateSchema)
  public generate(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(aiGenerateSchema)) body: AiGenerateInput & { async: boolean },
  ) {
    const { async: isAsync, ...input } = body;
    return isAsync ? this.ai.enqueue(user.id, input) : this.ai.generate(user.id, input);
  }

  @Post("compare")
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "AI Arena — مقایسه‌ی یک پرامپت روی چند مدل هم‌زمان" })
  @ApiBodyZod(aiCompareSchema)
  public compare(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(aiCompareSchema)) body: AiCompareInput,
  ) {
    return this.ai.compare(user.id, body);
  }

  @Get("usage")
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "مصرف روزانه‌ی لایه‌ی رایگان SYSTEM (سهمیه‌بندی)" })
  public usage(@CurrentUser() user: AuthenticatedUser) {
    return this.ai.usage(user.id);
  }

  @Get("jobs")
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "تاریخچه‌ی کارهای ناهم‌زمان کاربر (صفحه‌بندی‌شده)" })
  public jobs(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(paginationSchema)) query: Pagination,
  ) {
    return this.ai.jobs(user.id, query.page, query.pageSize);
  }

  @Get("jobs/:id")
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "وضعیت و نتیجه‌ی یک کار ناهم‌زمان" })
  @ApiParam({ name: "id", description: "شناسه‌ی کار (jobId بازگشتی از generate/ask-ai)" })
  public job(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.ai.job(user.id, id);
  }
}
