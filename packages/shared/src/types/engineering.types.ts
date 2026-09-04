export type ConductorMaterial = 'COPPER' | 'ALUMINUM';
export type CableInsulation = 'PVC' | 'XLPE';
export type InstallationMethod = 'IN_AIR' | 'UNDERGROUND' | 'IN_CONDUIT' | 'ON_TRAY';

export interface CableSizingInput {
  loadPowerKW: number;
  nominalVoltageV: number;       // e.g. 400V (Three phase) or 230V (Single phase)
  powerFactor: number;          // cos phi (e.g. 0.85)
  cableLengthMeters: number;
  conductorMaterial: ConductorMaterial;
  insulationType: CableInsulation;
  installationMethod: InstallationMethod;
  ambientTemperatureC: number;
  maxAllowableVoltageDropPercent: number; // e.g. 3% or 5% (IEC 60364)
}

export interface CableSizingResult {
  designCurrentAmperes: number;
  recommendedCrossSectionSqMm: number;
  actualVoltageDropPercent: number;
  actualVoltageDropVolts: number;
  cableResistanceOhmPerKm: number;
  isVoltageDropAcceptable: boolean;
  standardReference: string;
}

export interface CapacitorBankInput {
  activePowerKW: number;
  currentPowerFactor: number;   // e.g. 0.72
  targetPowerFactor: number;    // e.g. 0.95 (Tavanir requirement)
}

export interface CapacitorBankResult {
  requiredReactivePowerKVAR: number;
  recommendedStepConfiguration: number[]; // e.g. [25, 25, 50, 50]
  totalBankCapacityKVAR: number;
}
