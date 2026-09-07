import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  busbarSchema,
  capacitorBankSchema,
  cableSizingSchema,
  demandSchema,
  earthingSchema,
  generatorSchema,
  lightingSchema,
  pdfExportSchema,
  shortCircuitSchema,
  switchgearSchema,
  transformerSchema,
  voltageClassSchema,
  voltageDropSchema,
  type BusbarInputDto,
  type CableSizingInputDto,
  type CapacitorBankInputDto,
  type DemandInputDto,
  type EarthingInputDto,
  type GeneratorInputDto,
  type LightingInputDto,
  type PdfExportInputDto,
  type ShortCircuitInputDto,
  type SwitchgearInputDto,
  type TransformerInputDto,
  type VoltageClassInputDto,
  type VoltageDropInputDto,
} from "@xennic/shared";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator.js";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import { ApiBodyZod } from "../../common/utils/zod-openapi.js";
import { EngineeringService } from "./engineering.service.js";

@ApiTags("engineering")
@ApiBearerAuth("access-token")
@Controller("engineering")
export class EngineeringController {
  public constructor(private readonly engineering: EngineeringService) {}

  @Post("voltage-drop")
  @ApiOperation({ summary: "محاسبه افت ولتاژ (IEC 60364-5-52 / نشریه ۱۱۰)" })
  @ApiBodyZod(voltageDropSchema)
  public voltageDrop(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(voltageDropSchema)) body: VoltageDropInputDto,
  ) {
    return this.engineering.voltageDrop(user.id, body);
  }

  @Post("cable-sizing")
  @ApiOperation({ summary: "سایزینگ کابل بر پایه حد جریان و حد افت ولتاژ" })
  @ApiBodyZod(cableSizingSchema)
  public cable(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(cableSizingSchema)) body: CableSizingInputDto,
  ) {
    return this.engineering.cableSizing(user.id, body);
  }

  @Post("capacitor-bank")
  @ApiOperation({ summary: "محاسبه ظرفیت بانک خازنی و اصلاح ضریب قدرت" })
  @ApiBodyZod(capacitorBankSchema)
  public capacitor(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(capacitorBankSchema)) body: CapacitorBankInputDto,
  ) {
    return this.engineering.capacitorBank(user.id, body);
  }

  @Post("generator-size")
  @ApiOperation({ summary: "انتخاب ظرفیت ژنراتور/دیزل‌ژنراتور اضطراری" })
  @ApiBodyZod(generatorSchema)
  public generator(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(generatorSchema)) body: GeneratorInputDto,
  ) {
    return this.engineering.generator(user.id, body);
  }

  @Post("demand")
  @ApiOperation({ summary: "محاسبه‌ی بار و دیماند (مبحث ۱۳ / IEEE 141)" })
  @ApiBodyZod(demandSchema)
  public demand(
    @CurrentUser() _user: AuthenticatedUser,
    @Body(new ZodValidationPipe(demandSchema)) body: DemandInputDto,
  ) {
    return this.engineering.demand(body);
  }

  @Post("short-circuit")
  @ApiOperation({ summary: "جریان اتصال کوتاه و قدرت قطع (IEC 60909)" })
  @ApiBodyZod(shortCircuitSchema)
  public shortCircuit(
    @CurrentUser() _user: AuthenticatedUser,
    @Body(new ZodValidationPipe(shortCircuitSchema)) body: ShortCircuitInputDto,
  ) {
    return this.engineering.shortCircuit(body);
  }

  @Post("transformer")
  @ApiOperation({ summary: "انتخاب ترانسفورماتور توزیع (IEC 60076)" })
  @ApiBodyZod(transformerSchema)
  public transformer(
    @CurrentUser() _user: AuthenticatedUser,
    @Body(new ZodValidationPipe(transformerSchema)) body: TransformerInputDto,
  ) {
    return this.engineering.transformer(body);
  }

  @Post("switchgear")
  @ApiOperation({ summary: "انتخاب کلید/بریکر بر پایه‌ی ولتاژ، بار و سطح اتصال کوتاه" })
  @ApiBodyZod(switchgearSchema)
  public switchgear(
    @CurrentUser() _user: AuthenticatedUser,
    @Body(new ZodValidationPipe(switchgearSchema)) body: SwitchgearInputDto,
  ) {
    return this.engineering.switchgear(body);
  }

  @Post("busbar")
  @ApiOperation({ summary: "سایزینگ شینه (باس‌بار) بر پایه‌ی جریان بار" })
  @ApiBodyZod(busbarSchema)
  public busbar(
    @CurrentUser() _user: AuthenticatedUser,
    @Body(new ZodValidationPipe(busbarSchema)) body: BusbarInputDto,
  ) {
    return this.engineering.busbar(body);
  }

  @Post("voltage-class")
  @ApiOperation({ summary: "طبقه‌بندی ولتاژ و رنج نامی تجهیز (IEC 60038)" })
  @ApiBodyZod(voltageClassSchema)
  public voltageClass(
    @CurrentUser() _user: AuthenticatedUser,
    @Body(new ZodValidationPipe(voltageClassSchema)) body: VoltageClassInputDto,
  ) {
    return this.engineering.voltageClass(body);
  }

  @Post("earthing")
  @ApiOperation({ summary: "مقاومت الکترود زمین (IEEE 80 / مبحث ۱۳)" })
  @ApiBodyZod(earthingSchema)
  public earthing(
    @CurrentUser() _user: AuthenticatedUser,
    @Body(new ZodValidationPipe(earthingSchema)) body: EarthingInputDto,
  ) {
    return this.engineering.earthing(body);
  }

  @Post("lighting")
  @ApiOperation({ summary: "محاسبه‌ی روشنایی داخلی به روش لومن (مبحث ۱۳ / CIE)" })
  @ApiBodyZod(lightingSchema)
  public lighting(
    @CurrentUser() _user: AuthenticatedUser,
    @Body(new ZodValidationPipe(lightingSchema)) body: LightingInputDto,
  ) {
    return this.engineering.lighting(body);
  }

  @Get("tools")
  @ApiOperation({ summary: "فهرست ابزارهای جعبه‌ابزار مهندسی برق" })
  public tools() {
    return this.engineering.toolCatalog();
  }

  @Get("standards")
  @ApiOperation({ summary: "کتابخانه‌ی استانداردهای مرجع (ایرانی و بین‌المللی)" })
  public standards() {
    return this.engineering.standardLibrary();
  }

  @Post("export-pdf")
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: "صدور دفترچه محاسبات رسمی (PDF) — پردازش در صف" })
  @ApiBodyZod(pdfExportSchema)
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
