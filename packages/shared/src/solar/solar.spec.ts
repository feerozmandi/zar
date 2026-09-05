import { describe, expect, it } from "vitest";
import { calculateSolarRoi, estimateGeneration } from "./roi.js";

describe("solar roi", () => {
  it("generation is monotonic in capacity", () => {
    const a = estimateGeneration({ capacityKwp: 5, peakSunHours: 5.5 });
    const b = estimateGeneration({ capacityKwp: 10, peakSunHours: 5.5 });
    expect(b).toBeGreaterThan(a);
  });

  it("payback is finite for a sane project", () => {
    const roi = calculateSolarRoi({
      capacityKwp: 10,
      peakSunHours: 5.6,
      capexPerKwp: 550_000_000,
      feedInTariff: 12_000,
      offsetTariff: 8_000,
      annualOpex: 15_000_000,
    });
    expect(roi.annualGenerationKwh).toBeGreaterThan(10_000);
    expect(Number.isFinite(roi.simplePaybackYears)).toBe(true);
  });
});
