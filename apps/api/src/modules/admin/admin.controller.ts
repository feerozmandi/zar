import { Body, Controller, Delete, Get, Ip, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import {
  aiModelPatchSchema,
  aiModelUpsertSchema,
  articleUpsertSchema,
  paginationSchema,
  type AiModelPatchInput,
  type AiModelUpsertInput,
  type ArticleUpsertInput,
  type Pagination,
} from "@xennic/shared";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator.js";
import { Roles } from "../../common/decorators/roles.decorator.js";
import { RolesGuard } from "../../common/guards/roles.guard.js";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import { ApiBodyZod } from "../../common/utils/zod-openapi.js";
import { AdminService } from "./admin.service.js";

@ApiTags("admin")
@ApiBearerAuth("access-token")
@Controller("admin")
@UseGuards(RolesGuard)
@Roles("SUPER_ADMIN")
export class AdminController {
  public constructor(private readonly admin: AdminService) {}

  @Get("dashboard")
  @ApiOperation({ summary: "آمار کلی کاربران، تراکنش‌ها و بار سرور" })
  public dashboard() {
    return this.admin.dashboard();
  }

  @Get("transactions")
  @ApiOperation({ summary: "مدیریت پرداختی‌ها به تفکیک ماژول‌ها" })
  public transactions(@Query(new ZodValidationPipe(paginationSchema)) query: Pagination) {
    return this.admin.transactions(query.page, query.pageSize);
  }

  @Post("wiki")
  @ApiOperation({ summary: "ایجاد و ویرایش اسناد دانشنامه" })
  @ApiBodyZod(articleUpsertSchema)
  public upsertArticle(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(articleUpsertSchema)) input: ArticleUpsertInput,
  ) {
    return this.admin.upsertArticle(input, user.id);
  }

  @Get("audit-logs")
  @ApiOperation({ summary: "لاگ اقدامات مدیریتی" })
  public auditLogs(@Query("take") take = "100") {
    return this.admin.auditLogs(Number(take) || 100);
  }

  // ─────────────── مدیریت کاتالوگ مدل‌های AI ───────────────

  @Get("ai-models")
  @ApiOperation({ summary: "فهرست کامل کاتالوگ مدل‌ها (فعال و غیرفعال)" })
  public aiModels() {
    return this.admin.aiModels();
  }

  @Post("ai-models")
  @ApiOperation({ summary: "ایجاد/ویرایش مدل کاتالوگ (upsert بر اساس slug)" })
  @ApiBodyZod(aiModelUpsertSchema)
  public upsertAiModel(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(aiModelUpsertSchema)) input: AiModelUpsertInput,
    @Ip() ip: string,
  ) {
    return this.admin.upsertAiModel(input, user.id, ip);
  }

  @Patch("ai-models/:slug")
  @ApiOperation({ summary: "تغییر جزئی مدل (فعال/غیرفعال، قیمت، سقف توکن)" })
  @ApiParam({ name: "slug", description: "اسلاگ مدل در کاتالوگ" })
  @ApiBodyZod(aiModelPatchSchema)
  public patchAiModel(
    @CurrentUser() user: AuthenticatedUser,
    @Param("slug") slug: string,
    @Body(new ZodValidationPipe(aiModelPatchSchema)) input: AiModelPatchInput,
    @Ip() ip: string,
  ) {
    return this.admin.patchAiModel(slug, input, user.id, ip);
  }

  @Delete("ai-models/:slug")
  @ApiOperation({ summary: "حذف مدل از کاتالوگ" })
  @ApiParam({ name: "slug", description: "اسلاگ مدل در کاتالوگ" })
  public deleteAiModel(
    @CurrentUser() user: AuthenticatedUser,
    @Param("slug") slug: string,
    @Ip() ip: string,
  ) {
    return this.admin.deleteAiModel(slug, user.id, ip);
  }

  @Get("ai-stats")
  @ApiOperation({ summary: "آمار مصرف دروازه‌ی AI (فراخوان‌ها، توکن‌ها، وضعیت صف)" })
  public aiStats() {
    return this.admin.aiStats();
  }
}
