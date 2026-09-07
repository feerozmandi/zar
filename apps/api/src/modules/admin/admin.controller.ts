import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  articleUpsertSchema,
  paginationSchema,
  type ArticleUpsertInput,
  type Pagination,
} from "@xennic/shared";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator.js";
import { Roles } from "../../common/decorators/roles.decorator.js";
import { RolesGuard } from "../../common/guards/roles.guard.js";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import { AdminService } from "./admin.service.js";

@ApiTags("admin")
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
}
