import { Injectable, BadRequestException } from '@nestjs/common';
import {
  calculateCableSizing,
  calculateCapacitorBank,
} from '@xennic/shared';
import { CableSizingDto, CapacitorBankDto } from './engineering.controller';

@Injectable()
export class EngineeringService {
  sizeCable(dto: CableSizingDto) {
    if (!dto.loadPowerKW || dto.loadPowerKW <= 0) {
      throw new BadRequestException('توان مصرفی بار باید مثبت باشد');
    }
    if (!dto.cableLengthMeters || dto.cableLengthMeters <= 0) {
      throw new BadRequestException('طول کابل باید بزرگتر از صفر باشد');
    }

    const result = calculateCableSizing({
      loadPowerKW: dto.loadPowerKW,
      nominalVoltageV: dto.nominalVoltageV || 400,
      powerFactor: dto.powerFactor || 0.85,
      cableLengthMeters: dto.cableLengthMeters,
      conductorMaterial: dto.conductorMaterial || 'COPPER',
      insulationType: dto.insulationType || 'XLPE',
      installationMethod: dto.installationMethod || 'IN_AIR',
      ambientTemperatureC: dto.ambientTemperatureC || 30,
      maxAllowableVoltageDropPercent: dto.maxAllowableVoltageDropPercent || 3.0,
    });

    return {
      input: dto,
      result,
      complianceNotice: result.isVoltageDropAcceptable
        ? '✅ سطح مقطع انتخابی استانداردهای مبحث ۱۳ مقررات ملی ساختمان و IEC 60364 را تامین می‌کند.'
        : '⚠️ افت ولتاژ از حد مجاز استاندارد فراتر است، افزایش سایز کابل یا تغییر ولتاژ پیشنهاد می‌گردد.',
    };
  }

  sizeCapacitorBank(dto: CapacitorBankDto) {
    if (!dto.activePowerKW || dto.activePowerKW <= 0) {
      throw new BadRequestException('توان اکتیو الزامی است');
    }

    const result = calculateCapacitorBank({
      activePowerKW: dto.activePowerKW,
      currentPowerFactor: dto.currentPowerFactor || 0.75,
      targetPowerFactor: dto.targetPowerFactor || 0.95,
    });

    return {
      input: dto,
      result,
      recommendation: `نصب بانک خازنی اتوماتیک ${result.totalBankCapacityKVAR} کیلووار با پله‌های [${result.recommendedStepConfiguration.join('، ')}] کیلووار توصیه می‌شود.`,
    };
  }
}
