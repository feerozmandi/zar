import { Controller, Get, Post, Query, Body } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { billIngestSchema, type BillIngestInput, paginationSchema, type Pagination } from "@xennic/shared";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator.js";
import { Roles } from "../../common/decorators/roles.decorator.js";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import { ApiBodyZod } from "../../common/utils/zod-openapi.js";
import { BillService } from "./bill.service.js";

@ApiTags("bill")
@ApiBearerAuth("access-token")
@Controller("bill")
export class BillController {
  public constructor(private readonly bill: BillService) {}

  @Post("ingest")
  @ApiOperation({ summary: "آپلود و تحلیل هوشمند قبض (PDF/تصویر)" })
  @Roles("SUPER_ADMIN", "PRO_ENGINEER", "EPC_PARTNER", "USER")
  @ApiBodyZod(billIngestSchema)
  public async ingest(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(billIngestSchema)) input: BillIngestInput,
  ) {
    // TODO: پیمایش multipart/AmazonS3 ingestion در مرحله بعد
    // در این فاز، فراخوانی‌ها از Postman/raw Buffer یا service internal انجام می‌شود.
    return this.bill.ingest(input);
  }

  @Get("status")
  @ApiOperation({ summary: "وضعیت تحلیل قبض‌ها کاربر" })
  @Roles("SUPER_ADMIN", "PRO_ENGINEER", "EPC_PARTNER", "USER")
  public async status(@CurrentUser() user: AuthenticatedUser, @Query(new ZodValidationPipe(paginationSchema)) query: Pagination) {
    return this.bill.status(user.id, query);
  }

  @Get("findings")
  @ApiOperation({ summary: "یافته‌های تحلیل (severity CRITICAL/WARNING/INFO)" })
  @Roles("SUPER_ADMIN", "PRO_ENGINEER", "EPC_PARTNER", "USER")
  public async findings(@CurrentUser() user: AuthenticatedUser, @Query("analysisId") analysisId?: string) {
    return this.bill.findings(user.id, analysisId);
  }
}
