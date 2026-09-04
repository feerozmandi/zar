import { EngineeringService } from './engineering.service';

describe('EngineeringService', () => {
  let service: EngineeringService;

  beforeEach(() => {
    service = new EngineeringService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should calculate valid cable size and voltage drop per IEC', () => {
    const result = service.sizeCable({
      loadPowerKW: 45,
      nominalVoltageV: 400,
      powerFactor: 0.85,
      cableLengthMeters: 80,
      conductorMaterial: 'COPPER',
      insulationType: 'XLPE',
      installationMethod: 'IN_AIR',
      maxAllowableVoltageDropPercent: 3.0,
    });

    expect(result.result.recommendedCrossSectionSqMm).toBeGreaterThan(0);
    expect(result.result.actualVoltageDropPercent).toBeLessThanOrEqual(3.0);
    expect(result.result.isVoltageDropAcceptable).toBe(true);
  });

  it('should size capacitor bank correctly', () => {
    const result = service.sizeCapacitorBank({
      activePowerKW: 100,
      currentPowerFactor: 0.75,
      targetPowerFactor: 0.95,
    });

    expect(result.result.totalBankCapacityKVAR).toBeGreaterThan(0);
    expect(result.result.recommendedStepConfiguration.length).toBeGreaterThan(0);
  });
});
