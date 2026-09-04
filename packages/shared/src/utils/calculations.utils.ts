import {
  CONDUCTOR_RESISTIVITY,
  STANDARD_CABLE_CROSS_SECTIONS,
  COPPER_CURRENT_CAPACITY_MAP,
} from '../constants/standards.constants';
import {
  CableSizingInput,
  CableSizingResult,
  CapacitorBankInput,
  CapacitorBankResult,
} from '../types/engineering.types';
import {
  SolarFeasibilityInput,
  SolarFeasibilityResult,
} from '../types/solar.types';
import { SOLAR_SYSTEM_CONSTANTS } from '../constants/solar.constants';

/**
 * Calculates Cable Sizing and Voltage Drop based on IEC 60364
 */
export function calculateCableSizing(input: CableSizingInput): CableSizingResult {
  const {
    loadPowerKW,
    nominalVoltageV,
    powerFactor,
    cableLengthMeters,
    conductorMaterial,
    maxAllowableVoltageDropPercent,
  } = input;

  // Three phase design current: I = P / (sqrt(3) * V * cos phi)
  const isThreePhase = nominalVoltageV >= 380;
  const designCurrent = isThreePhase
    ? (loadPowerKW * 1000) / (Math.sqrt(3) * nominalVoltageV * powerFactor)
    : (loadPowerKW * 1000) / (nominalVoltageV * powerFactor);

  const rho =
    conductorMaterial === 'COPPER'
      ? CONDUCTOR_RESISTIVITY.COPPER
      : CONDUCTOR_RESISTIVITY.ALUMINUM;

  // Find candidate cross section based on ampacity and allowable voltage drop
  let selectedCrossSection = STANDARD_CABLE_CROSS_SECTIONS[0];
  let actualDropPercent = 100;
  let actualDropVolts = 0;
  let resistancePerKm = 0;

  for (const size of STANDARD_CABLE_CROSS_SECTIONS) {
    const ampacity = COPPER_CURRENT_CAPACITY_MAP[size] || size * 2.5;
    if (ampacity < designCurrent) {
      continue;
    }

    // Voltage drop in 3-phase: delta_V = sqrt(3) * I * L * (R/A * cos phi)
    const totalResistance = (rho * cableLengthMeters) / size;
    const deltaV = isThreePhase
      ? Math.sqrt(3) * designCurrent * totalResistance * powerFactor
      : 2 * designCurrent * totalResistance * powerFactor;

    const dropPercent = (deltaV / nominalVoltageV) * 100;

    if (dropPercent <= maxAllowableVoltageDropPercent) {
      selectedCrossSection = size;
      actualDropPercent = parseFloat(dropPercent.toFixed(2));
      actualDropVolts = parseFloat(deltaV.toFixed(2));
      resistancePerKm = parseFloat(((rho * 1000) / size).toFixed(4));
      break;
    }
  }

  // If none matched within limit, select largest
  if (actualDropPercent > maxAllowableVoltageDropPercent) {
    selectedCrossSection =
      STANDARD_CABLE_CROSS_SECTIONS[STANDARD_CABLE_CROSS_SECTIONS.length - 1];
    const totalResistance =
      (rho * cableLengthMeters) / selectedCrossSection;
    const deltaV = isThreePhase
      ? Math.sqrt(3) * designCurrent * totalResistance * powerFactor
      : 2 * designCurrent * totalResistance * powerFactor;
    actualDropPercent = parseFloat(((deltaV / nominalVoltageV) * 100).toFixed(2));
    actualDropVolts = parseFloat(deltaV.toFixed(2));
    resistancePerKm = parseFloat(((rho * 1000) / selectedCrossSection).toFixed(4));
  }

  return {
    designCurrentAmperes: parseFloat(designCurrent.toFixed(2)),
    recommendedCrossSectionSqMm: selectedCrossSection,
    actualVoltageDropPercent: actualDropPercent,
    actualVoltageDropVolts: actualDropVolts,
    cableResistanceOhmPerKm: resistancePerKm,
    isVoltageDropAcceptable: actualDropPercent <= maxAllowableVoltageDropPercent,
    standardReference: 'IEC 60364-5-52 / Publication 110',
  };
}

/**
 * Calculates Capacitor Bank Sizing for Power Factor Correction
 */
export function calculateCapacitorBank(
  input: CapacitorBankInput
): CapacitorBankResult {
  const { activePowerKW, currentPowerFactor, targetPowerFactor } = input;

  const tanPhi1 = Math.tan(Math.acos(Math.min(currentPowerFactor, 0.999)));
  const tanPhi2 = Math.tan(Math.acos(Math.min(targetPowerFactor, 0.999)));

  // Qc = P * (tan phi1 - tan phi2)
  const qRequired = Math.max(0, activePowerKW * (tanPhi1 - tanPhi2));
  const roundedQc = Math.ceil(qRequired / 5) * 5; // round to nearest 5 kVAR

  // Standard step distribution (e.g. 25, 50, 50, 100)
  const steps: number[] = [];
  let remaining = roundedQc;
  const standardStepSizes = [100, 50, 25, 12.5, 5];

  for (const stepSize of standardStepSizes) {
    while (remaining >= stepSize) {
      steps.push(stepSize);
      remaining -= stepSize;
    }
  }
  if (remaining > 0) {
    steps.push(remaining);
  }

  return {
    requiredReactivePowerKVAR: parseFloat(qRequired.toFixed(1)),
    recommendedStepConfiguration: steps,
    totalBankCapacityKVAR: roundedQc,
  };
}

/**
 * Calculates Solar Plant Feasibility & Financial Return (Article 12 / 16)
 */
export function calculateSolarFeasibility(
  input: SolarFeasibilityInput
): SolarFeasibilityResult {
  const { availableRoofAreaSqM, location } = input;

  // Max capacity based on area: area / 7.0 sqm per kW
  const capacityKW = Math.floor(
    availableRoofAreaSqM / SOLAR_SYSTEM_CONSTANTS.SQM_PER_KW_ROOFTOP
  );

  // Annual Generation (KWh) = Capacity (KW) * Peak Sun Hours * 365 * PR
  const annualGenKWh = Math.round(
    capacityKW *
      location.peakSunHoursDaily *
      365 *
      SOLAR_SYSTEM_CONSTANTS.PERFORMANCE_RATIO
  );

  const capexRials = capacityKW * SOLAR_SYSTEM_CONSTANTS.CAPEX_PER_KW_RIALS;

  // Average green revenue benchmark per KWh (~35,000 Rials / KWh in Green Exchange / Feed-in tariff)
  const greenTariffPerKWh = 35_000;
  const annualRevenueRials = annualGenKWh * greenTariffPerKWh;

  const paybackYears =
    annualRevenueRials > 0
      ? parseFloat((capexRials / annualRevenueRials).toFixed(1))
      : 0;

  const co2Tons = parseFloat(
    ((annualGenKWh * SOLAR_SYSTEM_CONSTANTS.CO2_KG_PER_KWH) / 1000).toFixed(1)
  );

  return {
    recommendedCapacityKW: capacityKW,
    annualGenerationKWh: annualGenKWh,
    co2ReductionTonsAnnual: co2Tons,
    estimatedCapitalExpenditureRials: capexRials,
    estimatedAnnualRevenueRials: annualRevenueRials,
    simplePaybackPeriodYears: paybackYears,
    netPresentValueRials: Math.round(annualRevenueRials * 10 - capexRials),
    internalRateOfReturnPercent: paybackYears > 0 ? parseFloat((100 / paybackYears).toFixed(1)) : 0,
  };
}
