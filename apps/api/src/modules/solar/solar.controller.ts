import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  INVERTER_CATALOG,
  MODULE_CATALOG,
  POLICY_SCENARIOS,
  PROVINCES,
  epcBidCompareSchema,
  epcRequestSchema,
  solarAssessSchema,
  solarDesignSchema,
  solarFeasibilitySchema,
  solarResourceQueryParamsSchema,
  solarRoiSchema,
  type EpcBidCompareInputDto,
  type EpcRequestInput,
  type SolarAssessInput,
  type SolarDesignInputDto,
  type SolarFeasibilityInputDto,
  type SolarResourceQueryParamsDto,
  type SolarRoiInputDto,
} from "@xennic/shared";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator.js";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import { ApiBodyZod } from "../../common/utils/zod-openapi.js";
import { SolarService } from "./solar.service.js";

@ApiTags("solar")
@ApiBearerAuth("access-token")
@Controller("solar")
export class SolarController {
  public constructor(private readonly solar: SolarService) {}

  @Post("feasibility")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "گزارش کامل امکان‌سنجی نیروگاه خورشیدی",
    description:
      "محاسبه‌ی تابش، چیدمان آرایه روی سقف، تولید ساعتی، قبض قبل/بعد و مقایسه‌ی سناریوهای " +
      "خودتأمین، ماده ۱۲ و بورس سبز — همان خروجی در وب و API.",
  })
  @ApiBodyZod(solarFeasibilitySchema)
  public feasibility(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(solarFeasibilitySchema)) body: SolarFeasibilityInputDto,
  ) {
    return this.solar.feasibility(user.id, body);
  }

  @Post("assess")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "محاسبه پتانسیل تابش و ظرفیت پیشنهادی (مسیر سازگار با نسل قبل)" })
  @ApiBodyZod(solarAssessSchema)
  public assess(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(solarAssessSchema)) body: SolarAssessInput,
  ) {
    return this.solar.assess(user.id, body);
  }

  @Get("assessments/:id")
  @ApiOperation({ summary: "بازخوانی گزارش امکان‌سنجی ذخیره‌شده" })
  public assessment(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.solar.assessment(user.id, id);
  }

  @Get("resource")
  @ApiOperation({ summary: "برآورد منبع تابش خورشید برای یک استان یا نقطه‌ی جغرافیایی" })
  public resource(
    @Query(new ZodValidationPipe(solarResourceQueryParamsSchema))
    query: SolarResourceQueryParamsDto,
  ) {
    return this.solar.resource(query);
  }

  @Post("design")
  @ApiOperation({ summary: "پیش‌نمایش چیدمان آرایه روی صفحه‌ی سقف (طراح سقف)" })
  @ApiBodyZod(solarDesignSchema)
  public design(@Body(new ZodValidationPipe(solarDesignSchema)) body: SolarDesignInputDto) {
    return this.solar.design(body);
  }

  @Post("roi-calculator")
  @ApiOperation({ summary: "محاسبه مالی بازگشت سرمایه (ماده ۱۲ و ۱۶)" })
  @ApiBodyZod(solarRoiSchema)
  public roi(@Body(new ZodValidationPipe(solarRoiSchema)) body: SolarRoiInputDto) {
    return this.solar.roi(body);
  }

  @Post("epc-request")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "ثبت درخواست ارجاع پروژه به مجریان EPC" })
  @ApiBodyZod(epcRequestSchema)
  public epc(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(epcRequestSchema)) body: EpcRequestInput,
  ) {
    return this.solar.createEpcRequest(user.id, body);
  }

  @Post("epc-bids/compare")
  @ApiOperation({
    summary: "مقایسه‌ی پیشنهادهای پیمانکاران",
    description: "امتیازدهی وزن‌دار به قیمت، تجهیزات، گارانتی، رتبه و زمان‌بندی (مناقصه معکوس).",
  })
  @ApiBodyZod(epcBidCompareSchema)
  public compareBids(@Body(new ZodValidationPipe(epcBidCompareSchema)) body: EpcBidCompareInputDto) {
    return this.solar.compareBids(body.bids, body.weights);
  }

  @Get("catalog")
  @ApiOperation({ summary: "کاتالوگ تجهیزات، سناریوهای نظارتی و استان‌ها" })
  public catalog() {
    return {
      modules: MODULE_CATALOG,
      inverters: INVERTER_CATALOG,
      scenarios: POLICY_SCENARIOS,
      provinces: PROVINCES.map((province) => ({
        code: province.code,
        name: province.nameFa,
        lat: province.lat,
        lon: province.lon,
      })),
    };
  }

  @Get("sites")
  @ApiOperation({ summary: "فهرست سایت‌های بررسی‌شده‌ی کاربر" })
  public sites(@CurrentUser() user: AuthenticatedUser) {
    return this.solar.sites(user.id);
  }
}
