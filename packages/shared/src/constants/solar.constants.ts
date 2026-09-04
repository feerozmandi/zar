/**
 * Solar Irradiation benchmarks across Iranian Provinces
 * Source: SATBA (سازمان انرژی‌های تجدیدپذیر و بهره‌وری انرژی برق)
 */
export const IRAN_SOLAR_IRRADIATION_BENCHMARKS: Record<string, { ghi: number; sunHours: number }> = {
  'یزد': { ghi: 2200, sunHours: 5.6 },
  'کرمان': { ghi: 2250, sunHours: 5.8 },
  'اصفهان': { ghi: 2100, sunHours: 5.4 },
  'فارس': { ghi: 2150, sunHours: 5.5 },
  'سمنان': { ghi: 2050, sunHours: 5.3 },
  'خراسان رضوی': { ghi: 1980, sunHours: 5.1 },
  'تهران': { ghi: 1900, sunHours: 4.9 },
  'خوزستان': { ghi: 2180, sunHours: 5.5 },
  'آذربایجان شرقی': { ghi: 1800, sunHours: 4.6 },
};

export const SOLAR_SYSTEM_CONSTANTS = {
  // Approximate surface area needed per KW of solar capacity (Sq meters)
  SQM_PER_KW_ROOFTOP: 7.0,
  SQM_PER_KW_GROUND: 12.0,

  // Performance Ratio (PR) of solar plants in Iran
  PERFORMANCE_RATIO: 0.78,

  // Capex estimate per KW in Rials (Benchmark 2026)
  CAPEX_PER_KW_RIALS: 280_000_000, // ۲۸ میلیون تومان به ازای هر کیلووات

  // CO2 reduction factor in kg per KWh in Iran grid
  CO2_KG_PER_KWH: 0.65,
};
