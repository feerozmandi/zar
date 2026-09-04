export type SolarSubsidyPolicy = 'ARTICLE_12' | 'ARTICLE_16' | 'GREEN_EXCHANGE' | 'GUARANTEED_PURCHASE';

export interface SolarLocationData {
  province: string;
  city: string;
  latitude: number;
  longitude: number;
  annualGHI_KWh_m2: number; // Global Horizontal Irradiance (KWh/m^2/year)
  peakSunHoursDaily: number;
}

export interface SolarFeasibilityInput {
  location: SolarLocationData;
  availableRoofAreaSqM: number;
  monthlyAverageConsumptionKWh: number;
  contractDemandKW: number;
  subsidyModel: SolarSubsidyPolicy;
}

export interface SolarFeasibilityResult {
  recommendedCapacityKW: number;
  annualGenerationKWh: number;
  co2ReductionTonsAnnual: number;
  estimatedCapitalExpenditureRials: number;
  estimatedAnnualRevenueRials: number;
  simplePaybackPeriodYears: number;
  netPresentValueRials: number;
  internalRateOfReturnPercent: number;
}
