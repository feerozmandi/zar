import { AuditService } from './audit.service';

describe('AuditService', () => {
  let service: AuditService;

  beforeEach(() => {
    service = new AuditService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should calculate reactive penalty when power factor is below 0.90', () => {
    const result = service.analyzeBill({
      billIdentifier: '12345678',
      tariffType: 'INDUSTRIAL',
      contractDemandKW: 200,
      peakMeasuredKW: 180,
      lowLoadKWh: 10000,
      midLoadKWh: 20000,
      peakLoadKWh: 15000,
      reactiveKWh: 40000, // high reactive leading to low power factor
    });

    expect(result.summary.powerFactor).toBeLessThan(0.9);
    expect(result.summary.isPowerFactorCompliant).toBe(false);
    expect(result.costsRials.reactivePenalty).toBeGreaterThan(0);
    expect(result.optimization.recommendedCapacitorKVAR).toBeGreaterThan(0);
  });

  it('should calculate demand penalty when peak measured exceeds contract demand', () => {
    const result = service.analyzeBill({
      billIdentifier: '87654321',
      tariffType: 'INDUSTRIAL',
      contractDemandKW: 100,
      peakMeasuredKW: 150, // 50 kW overrun
      lowLoadKWh: 5000,
      midLoadKWh: 10000,
      peakLoadKWh: 5000,
      reactiveKWh: 2000,
    });

    expect(result.costsRials.demandPenalty).toBeGreaterThan(0);
  });
});
