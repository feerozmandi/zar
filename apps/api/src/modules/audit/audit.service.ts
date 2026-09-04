import { Injectable, BadRequestException } from '@nestjs/common';
import { TAVANIR_TARIFF_CONSTANTS } from '@xennic/shared';
import { AnalyzeBillDto } from './audit.controller';

@Injectable()
export class AuditService {
  analyzeBill(dto: AnalyzeBillDto) {
    if (!dto.contractDemandKW || dto.contractDemandKW <= 0) {
      throw new BadRequestException('قدرت قراردادی (دیماند) الزامی است');
    }

    const totalActiveKWh = dto.lowLoadKWh + dto.midLoadKWh + dto.peakLoadKWh;
    if (totalActiveKWh <= 0) {
      throw new BadRequestException('مجموع مصارف اکتیو باید بیشتر از صفر باشد');
    }

    // 1. Calculate Active Energy Cost (TOU)
    const activeCost =
      dto.lowLoadKWh * TAVANIR_TARIFF_CONSTANTS.TOU_RATES.LOW_LOAD +
      dto.midLoadKWh * TAVANIR_TARIFF_CONSTANTS.TOU_RATES.MID_LOAD +
      dto.peakLoadKWh * TAVANIR_TARIFF_CONSTANTS.TOU_RATES.PEAK_LOAD;

    // 2. Power Factor Calculation: cos phi = Active / sqrt(Active^2 + Reactive^2)
    const apparentEnergy = Math.sqrt(
      Math.pow(totalActiveKWh, 2) + Math.pow(dto.reactiveKWh, 2)
    );
    const powerFactor =
      apparentEnergy > 0
        ? parseFloat((totalActiveKWh / apparentEnergy).toFixed(3))
        : 1.0;

    // 3. Reactive Penalty Calculation (if cos phi < 0.90)
    let reactivePenalty = 0;
    if (powerFactor < TAVANIR_TARIFF_CONSTANTS.TARGET_POWER_FACTOR) {
      const reactiveDeficit =
        dto.reactiveKWh -
        totalActiveKWh *
          Math.tan(
            Math.acos(TAVANIR_TARIFF_CONSTANTS.TARGET_POWER_FACTOR)
          );
      if (reactiveDeficit > 0) {
        reactivePenalty =
          Math.round(
            reactiveDeficit *
              TAVANIR_TARIFF_CONSTANTS.TOU_RATES.MID_LOAD *
              TAVANIR_TARIFF_CONSTANTS.REACTIVE_PENALTY_MULTIPLIER
          );
      }
    }

    // 4. Demand Overrun Penalty (تجاوز از قدرت قراردادی)
    let demandPenalty = 0;
    const baseDemandCharge =
      dto.contractDemandKW *
      TAVANIR_TARIFF_CONSTANTS.INDUSTRIAL_DEMAND_CHARGE_PER_KW;

    if (dto.peakMeasuredKW > dto.contractDemandKW) {
      const excessKW = dto.peakMeasuredKW - dto.contractDemandKW;
      demandPenalty = Math.round(
        excessKW *
          TAVANIR_TARIFF_CONSTANTS.INDUSTRIAL_DEMAND_CHARGE_PER_KW *
          TAVANIR_TARIFF_CONSTANTS.DEMAND_OVERRUN_PENALTY_RATE
      );
    }

    // 5. Taxes and Total
    const subtotal = activeCost + reactivePenalty + baseDemandCharge + demandPenalty;
    const vatAndDuty = Math.round(
      subtotal * (TAVANIR_TARIFF_CONSTANTS.VAT_PERCENTAGE + TAVANIR_TARIFF_CONSTANTS.ELECTRICITY_DUTY_PERCENTAGE)
    );
    const totalPayable = subtotal + vatAndDuty;

    // 6. Recommended Capacitor Bank size in kVAR
    const requiredCapacitorKVAR =
      powerFactor < 0.95
        ? Math.round(
            dto.contractDemandKW *
              (Math.tan(Math.acos(powerFactor)) - Math.tan(Math.acos(0.95)))
          )
        : 0;

    const potentialAnnualSavings = (reactivePenalty + demandPenalty) * 12;

    const aiRecommendations = [
      powerFactor < 0.90
        ? `🚨 ضریب توان تاسیسات شما (${powerFactor}) پایین‌تر از حد استاندارد توانیر (۰.۹۰) است. نصب بانک خازنی با ظرفیت ${requiredCapacitorKVAR} kVAR می‌تواند سالانه ${(reactivePenalty * 12).toLocaleString('fa-IR')} ریال جریمه راکتیو را حذف کند.`
        : '✅ ضریب توان تاسیسات در محدوده استاندارد و مجاز قرار دارد.',
      dto.peakMeasuredKW > dto.contractDemandKW
        ? `⚠️ در این دوره پیک مصرف (${dto.peakMeasuredKW} کیلووات) از دیماند قراردادی (${dto.contractDemandKW} کیلووات) فراتر رفته است. جابجایی بار ساعات اوج یا ارتقای دیماند پیشنهاد می‌شود.`
        : '✅ دیماند مصرفی در محدوده مجاز قراردادی کنترل شده است.',
      dto.peakLoadKWh / totalActiveKWh > 0.35
        ? '💡 سهم مصرف در ساعات اوج‌بار بالا است (بیش از ۳۵٪). انتقال بارهای غیرحیاتی به ساعات کم‌باری می‌تواند تا ۱۵٪ هزینه اکتیو را کاهش دهد.'
        : '📊 توزیع زمانی مصرف انرژی در ساعات مختلف متعادل ارزیابی می‌شود.',
    ];

    return {
      billIdentifier: dto.billIdentifier,
      summary: {
        totalActiveKWh,
        powerFactor,
        isPowerFactorCompliant: powerFactor >= TAVANIR_TARIFF_CONSTANTS.TARGET_POWER_FACTOR,
      },
      costsRials: {
        activeCost,
        baseDemandCharge,
        reactivePenalty,
        demandPenalty,
        vatAndDuty,
        totalPayable,
      },
      optimization: {
        recommendedCapacitorKVAR: Math.max(0, requiredCapacitorKVAR),
        potentialAnnualSavingsRials: potentialAnnualSavings,
      },
      aiRecommendations,
    };
  }

  getAuditHistory() {
    return [
      {
        id: 'audit-demo-01',
        billIdentifier: '982341029412',
        period: 'مرداد ۱۴۰۵',
        totalPayableRials: 485_000_000,
        powerFactor: 0.78,
        penaltyAmountRials: 64_000_000,
        status: 'ANALYZED',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'audit-demo-02',
        billIdentifier: '982341029412',
        period: 'تیر ۱۴۰۵',
        totalPayableRials: 520_000_000,
        powerFactor: 0.74,
        penaltyAmountRials: 82_000_000,
        status: 'ANALYZED',
        createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
      },
    ];
  }
}
