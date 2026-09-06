import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { aiGenerateSchema, type AiGenerateInput } from "@xennic/shared";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator.js";
import { Public } from "../../common/decorators/roles.decorator.js";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
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
  @ApiOperation({ summary: "ارسال پرامپت به مدل انتخابی (GitHub Models یا کلید کاربر)" })
  public generate(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(aiGenerateSchema)) body: AiGenerateInput & { async: boolean },
  ) {
    const { async: isAsync, ...input } = body;
    return isAsync ? this.ai.enqueue(user.id, input) : this.ai.generate(user.id, input);
  }
}
