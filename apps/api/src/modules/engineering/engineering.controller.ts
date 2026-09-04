import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EngineeringService } from './engineering.service';
import { ConductorMaterial, CableInsulation, InstallationMethod } from '@xennic/shared';

export class CableSizingDto {
  loadPowerKW!: number;
  nominalVoltageV!: number;
  powerFactor!: number;
  cableLengthMeters!: number;
  conductorMaterial!: ConductorMaterial;
  insulationType!: CableInsulation;
  installationMethod!: InstallationMethod;
  ambientTemperatureC?: number;
  maxAllowableVoltageDropPercent?: number;
}

export class CapacitorBankDto {
  activePowerKW!: number;
  currentPowerFactor!: number;
  targetPowerFactor?: number;
}

@ApiTags('Engineering Suite (جعبه‌ابزار محاسبات مهندسی)')
@Controller('engineering')
export class EngineeringController {
  constructor(private readonly engineeringService: EngineeringService) {}

  @Post('cable-sizing')
  @ApiOperation({ summary: 'Calculate cable size and voltage drop per IEC 60364 & نشریه ۱۱۰' })
  @ApiResponse({ status: 200, description: 'Cable sizing calculated' })
  async calculateCable(@Body() dto: CableSizingDto) {
    return this.engineeringService.sizeCable(dto);
  }

  @Post('capacitor-bank')
  @ApiOperation({ summary: 'Calculate required capacitor bank for power factor correction' })
  @ApiResponse({ status: 200, description: 'Capacitor bank sized' })
  async calculateCapacitor(@Body() dto: CapacitorBankDto) {
    return this.engineeringService.sizeCapacitorBank(dto);
  }
}
