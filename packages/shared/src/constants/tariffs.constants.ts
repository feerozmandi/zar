/**
 * Iranian Electricity Tariffs & Tavanir Regulations
 * Prices in Iranian Rials (IRR) - Benchmark & Simulation Values
 */
export const TAVANIR_TARIFF_CONSTANTS = {
  // Standard Power Factor Threshold (cos phi)
  TARGET_POWER_FACTOR: 0.90,

  // Reactive Penalty multiplier when cos phi < 0.9
  REACTIVE_PENALTY_MULTIPLIER: 1.5,

  // Industrial Demand Charges per KW monthly (Average benchmark)
  INDUSTRIAL_DEMAND_CHARGE_PER_KW: 185_000,

  // Penalty multiplier for exceeding contractual demand
  DEMAND_OVERRUN_PENALTY_RATE: 2.0,

  // Energy Time-of-Use Rates (Sample Industrial Tariff in Rials/KWh)
  TOU_RATES: {
    LOW_LOAD: 1200,   // کم‌باری (۲۳ تا ۷ صبح)
    MID_LOAD: 2400,   // میان‌باری (۷ تا ۱۹)
    PEAK_LOAD: 4800,  // اوج‌بار (۱۹ تا ۲۳)
  },

  // Value Added Tax & Duties
  VAT_PERCENTAGE: 0.10,
  ELECTRICITY_DUTY_PERCENTAGE: 0.10,
};
