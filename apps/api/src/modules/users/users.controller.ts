import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { aiKeySchema, aiSettingsSchema, type AiKeyInput, type AiSettingsInput } from "@xennic/shared";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator.js";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import { UsersService } from "./users.service.js";

@ApiTags("users")
@Controller("user")
export class UsersController {
  public constructor(private readonly users: UsersService) {}

  @Get("profile")
  @ApiOperation({ summary: "پروفایل و کیف‌پول ماژول‌ها" })
  public profile(@CurrentUser() user: AuthenticatedUser) {
    return this.users.profile(user.id);
  }

  @Post("ai-settings")
  @ApiOperation({ summary: "ذخیره‌ی کلید اختصاصی API (BYOK) با رمزنگاری AES-256-GCM" })
  public saveKey(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(aiKeySchema)) input: AiKeyInput,
  ) {
    return this.users.saveAiKey(user.id, input);
  }

  @Put("ai-settings")
  @ApiOperation({ summary: "تنظیم مدل پیش‌فرض و وضعیت فعال‌بودن کلید" })
  public updateSettings(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(aiSettingsSchema)) input: AiSettingsInput,
  ) {
    return this.users.updateAiSettings(user.id, input);
  }

  @Get("ai-settings")
  @ApiOperation({ summary: "فهرست کلیدهای کاربر (بدون نمایش مقدار خام)" })
  public listKeys(@CurrentUser() user: AuthenticatedUser) {
    return this.users.listAiKeys(user.id);
  }

  @Delete("ai-settings/:id")
  @ApiOperation({ summary: "حذف کلید اختصاصی" })
  public deleteKey(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.users.deleteAiKey(user.id, id);
  }
}
