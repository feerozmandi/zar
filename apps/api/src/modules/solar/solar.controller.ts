import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SolarService } from './solar.service';
import { SolarSubsidyPolicy } from '@xennic/shared';

export class AssessSolarDto {
  province!: string;
  city!: string;
  roofAreaSqM!: number;
  contractDemandKW!: number;
  monthlyAverageConsumptionKWh!: number;
  subsidyModel?: SolarSubsidyPolicy;
}

@ApiTags('Solar ROI & Feasibility (امکان‌سنجی خورشیدی)')
@Controller('solar')
export class SolarController {
  constructor(private readonly solarService: SolarService) {}

  @Post('assess')
  @ApiOperation({ summary: 'Calculate Solar Feasibility, ROI & Carbon Offset' })
  @ApiResponse({ status: 200, description: 'Solar feasibility report calculated' })
  async assess(@Body() dto: AssessSolarDto) {
    return this.solarService.calculateFeasibility(dto);
  }

  @Get('provinces')
  @ApiOperation({ summary: 'List Iranian provinces and average solar irradiation benchmarks' })
  async getProvinces() {
    return this.solarService.getProvincesData();
  }
}
