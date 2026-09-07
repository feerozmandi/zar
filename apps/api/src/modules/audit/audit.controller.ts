import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import { auditAnalyzeSchema, paginationSchema, type Pagination } from "@xennic/shared";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator.js";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import { AuditService, type UploadedBillFile } from "./audit.service.js";
import { UploadBillDto } from "./dto/upload-bill.dto.js";

@ApiTags("audit")
@Controller("audit")
export class AuditController {
  public constructor(private readonly audit: AuditService) {}

  @Post("upload")
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "آپلود فایل/تصویر قبض" })
  @ApiBody({ schema: { type: "object", properties: { file: { type: "string", format: "binary" } } } })
  public upload(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: UploadedBillFile,
    @Body() meta: UploadBillDto,
  ) {
    return this.audit.upload(user.id, file, meta);
  }

  @Post("analyze")
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: "استخراج داده با OCR و تحلیل جریمه راکتیو/دیماند" })
  public analyze(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(auditAnalyzeSchema))
    body: { billId: string; withAi: boolean; model?: string },
  ) {
    return this.audit.analyze(user.id, body.billId, body.withAi, body.model);
  }

  @Get("history")
  @ApiOperation({ summary: "آرشیو قبوض و گزارش‌های قبلی" })
  public history(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(paginationSchema)) page: Pagination,
  ) {
    return this.audit.history(user.id, page.page, page.pageSize);
  }
}
