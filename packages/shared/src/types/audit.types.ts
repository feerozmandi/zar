export type BillType = 'INDUSTRIAL' | 'COMMERCIAL' | 'AGRICULTURAL' | 'RESIDENTIAL';

export interface BillConsumptionPeriod {
  lowLoadKWh: number;     // کم‌باری
  midLoadKWh: number;     // میان‌باری
  peakLoadKWh: number;    // اوج‌بار
  reactiveKWh: number;    // راکتیو
}

export interface BillFinancialAnalysis {
  activeEnergyCostRials: number;
  reactivePenaltyRials: number;
  demandPenaltyRials: number;
  fuelTaxAndDutiesRials: number;
  totalPayableRials: number;
  powerFactor: number;             // ضریب توان (cos phi)
  isPowerFactorCompliant: boolean; // آیا cos phi >= 0.9 است؟
  recommendedCapacitorKVAR: number;
  potentialAnnualSavingsRials: number;
}

export interface BillAuditReport {
  billId: string;
  tariffCode: string;
  contractDemandKW: number;
  measuredPeakKW: number;
  consumption: BillConsumptionPeriod;
  analysis: BillFinancialAnalysis;
  aiRecommendations: string[];
}
