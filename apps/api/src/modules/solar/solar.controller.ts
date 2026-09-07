import { Body, Controller, Get, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  epcRequestSchema,
  solarAssessSchema,
  solarRoiSchema,
  type EpcRequestInput,
  type SolarAssessInput,
  type SolarRoiInputDto,
} from "@xennic/shared";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator.js";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import { SolarService } from "./solar.service.js";

@ApiTags("solar")
@Controller("solar")
export class SolarController {
  public constructor(private readonly solar: SolarService) {}

  @Post("assess")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "محاسبه پتانسیل تابش و ظرفیت پیشنهادی" })
  public assess(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(solarAssessSchema)) body: SolarAssessInput,
  ) {
    return this.solar.assess(user.id, body);
  }

  @Post("roi-calculator")
  @ApiOperation({ summary: "محاسبه مالی بازگشت سرمایه (ماده ۱۲ و ۱۶)" })
  public roi(@Body(new ZodValidationPipe(solarRoiSchema)) body: SolarRoiInputDto) {
    return this.solar.roi(body);
  }

  @Post("epc-request")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "ثبت درخواست ارجاع پروژه به مجریان EPC" })
  public epc(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(epcRequestSchema)) body: EpcRequestInput,
  ) {
    return this.solar.createEpcRequest(user.id, body);
  }

  @Get("sites")
  @ApiOperation({ summary: "فهرست سایت‌های بررسی‌شده‌ی کاربر" })
  public sites(@CurrentUser() user: AuthenticatedUser) {
    return this.solar.sites(user.id);
  }
}
