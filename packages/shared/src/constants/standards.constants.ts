/**
 * IEC 60364 & Iranian Publication 110 (نشریه ۱۱۰) Electrical Standards
 */

// Resistivity (rho) in Ohm.mm^2 / m at 20°C
export const CONDUCTOR_RESISTIVITY = {
  COPPER: 0.0175,
  ALUMINUM: 0.0282,
};

// Standard Cross Sections (mm^2) according to IEC 60228
export const STANDARD_CABLE_CROSS_SECTIONS = [
  1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400, 500,
];

// Current carrying capacity approx (A) for 3-core copper in conduit/air (reference values)
export const COPPER_CURRENT_CAPACITY_MAP: Record<number, number> = {
  1.5: 18,
  2.5: 25,
  4: 34,
  6: 44,
  10: 60,
  16: 80,
  25: 106,
  35: 131,
  50: 159,
  70: 202,
  95: 244,
  120: 282,
  150: 324,
  185: 371,
  240: 436,
  300: 500,
};
