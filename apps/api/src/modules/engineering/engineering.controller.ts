import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  capacitorBankSchema,
  cableSizingSchema,
  generatorSchema,
  pdfExportSchema,
  voltageDropSchema,
  type CableSizingInputDto,
  type CapacitorBankInputDto,
  type GeneratorInputDto,
  type PdfExportInputDto,
  type VoltageDropInputDto,
} from "@xennic/shared";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator.js";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import { EngineeringService } from "./engineering.service.js";

@ApiTags("engineering")
@Controller("engineering")
export class EngineeringController {
  public constructor(private readonly engineering: EngineeringService) {}

  @Post("voltage-drop")
  @ApiOperation({ summary: "محاسبه افت ولتاژ (IEC 60364-5-52 / نشریه ۱۱۰)" })
  public voltageDrop(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(voltageDropSchema)) body: VoltageDropInputDto,
  ) {
    return this.engineering.voltageDrop(user.id, body);
  }

  @Post("cable-sizing")
  @ApiOperation({ summary: "سایزینگ کابل بر پایه حد جریان و حد افت ولتاژ" })
  public cable(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(cableSizingSchema)) body: CableSizingInputDto,
  ) {
    return this.engineering.cableSizing(user.id, body);
  }

  @Post("capacitor-bank")
  @ApiOperation({ summary: "محاسبه ظرفیت بانک خازنی و اصلاح ضریب قدرت" })
  public capacitor(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(capacitorBankSchema)) body: CapacitorBankInputDto,
  ) {
    return this.engineering.capacitorBank(user.id, body);
  }

  @Post("generator-size")
  @ApiOperation({ summary: "انتخاب ظرفیت ژنراتور/دیزل‌ژنراتور اضطراری" })
  public generator(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(generatorSchema)) body: GeneratorInputDto,
  ) {
    return this.engineering.generator(user.id, body);
  }

  @Post("export-pdf")
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: "صدور دفترچه محاسبات رسمی (PDF) — پردازش در صف" })
  public exportPdf(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(pdfExportSchema)) body: PdfExportInputDto,
  ) {
    return this.engineering.exportPdf(user.id, body);
  }

  @Get("calculations")
  @ApiOperation({ summary: "تاریخچه محاسبات کاربر" })
  public list(
    @CurrentUser() user: AuthenticatedUser,
    @Query("tool") tool?: "VOLTAGE_DROP" | "CABLE_SIZING" | "CAPACITOR_BANK" | "GENERATOR_SIZE",
  ) {
    return this.engineering.list(user.id, tool);
  }
}
