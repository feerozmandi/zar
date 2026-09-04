import { Injectable, BadRequestException } from '@nestjs/common';
import {
  calculateSolarFeasibility,
  IRAN_SOLAR_IRRADIATION_BENCHMARKS,
  SolarLocationData,
} from '@xennic/shared';
import { AssessSolarDto } from './solar.controller';

@Injectable()
export class SolarService {
  getProvincesData() {
    return Object.entries(IRAN_SOLAR_IRRADIATION_BENCHMARKS).map(
      ([province, data]) => ({
        province,
        ghiAnnualKWh: data.ghi,
        peakSunHours: data.sunHours,
      })
    );
  }

  calculateFeasibility(dto: AssessSolarDto) {
    if (!dto.roofAreaSqM || dto.roofAreaSqM < 20) {
      throw new BadRequestException('حداقل مساحت سقف مورد نیاز ۲۰ متر مربع می‌باشد');
    }

    const provinceData =
      IRAN_SOLAR_IRRADIATION_BENCHMARKS[dto.province] ||
      IRAN_SOLAR_IRRADIATION_BENCHMARKS['تهران'];

    const location: SolarLocationData = {
      province: dto.province || 'تهران',
      city: dto.city || 'تهران',
      latitude: 35.6892,
      longitude: 51.3890,
      annualGHI_KWh_m2: provinceData.ghi,
      peakSunHoursDaily: provinceData.sunHours,
    };

    const calculation = calculateSolarFeasibility({
      location,
      availableRoofAreaSqM: dto.roofAreaSqM,
      contractDemandKW: dto.contractDemandKW || 100,
      monthlyAverageConsumptionKWh: dto.monthlyAverageConsumptionKWh || 15000,
      subsidyModel: dto.subsidyModel || 'ARTICLE_16',
    });

    return {
      location,
      inputParams: {
        roofAreaSqM: dto.roofAreaSqM,
        subsidyModel: dto.subsidyModel || 'ARTICLE_16',
      },
      feasibility: calculation,
      policyInsights: {
        article16Compliance: calculation.recommendedCapacityKW >= (dto.contractDemandKW || 100) * 0.05
          ? '✅ این ظرفیت ۵٪ تعهد قانونی صنایع طبق ماده ۱۶ را به طور کامل پوشش می‌دهد.'
          : '⚠️ ظرفیت پیشنهادی کمتر از ۵٪ دیماند است و برای رفع کامل جرایم ماده ۱۶ نیاز به افزایش سطح پنل‌ها دارید.',
        greenExchangeMarketRevenue: 'فروش برق تجدیدپذیر از طریق تابلوی سبز بورس انرژی با نرخ‌های شناور امکان‌پذیر است.',
      },
    };
  }
}
