import { SolarService } from './solar.service';

describe('SolarService', () => {
  let service: SolarService;

  beforeEach(() => {
    service = new SolarService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should calculate solar feasibility and ROI', () => {
    const result = service.calculateFeasibility({
      province: 'یزد',
      city: 'یزد',
      roofAreaSqM: 700, // ~100 kW
      contractDemandKW: 200,
      monthlyAverageConsumptionKWh: 30000,
      subsidyModel: 'ARTICLE_16',
    });

    expect(result.feasibility.recommendedCapacityKW).toBe(100);
    expect(result.feasibility.annualGenerationKWh).toBeGreaterThan(0);
    expect(result.feasibility.estimatedCapitalExpenditureRials).toBeGreaterThan(0);
    expect(result.feasibility.simplePaybackPeriodYears).toBeGreaterThan(0);
  });
});
