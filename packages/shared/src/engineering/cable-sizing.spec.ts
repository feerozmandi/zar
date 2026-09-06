import { describe, expect, it } from "vitest";
import { sizeCable, temperatureCorrection } from "./cable-sizing.js";

describe("cable sizing", () => {
  it("selects a bigger cable for a longer run", () => {
    const short = sizeCable({ system: "three", voltage: 400, current: 60, length: 30 });
    const long = sizeCable({ system: "three", voltage: 400, current: 60, length: 250 });
    const shortSection = short.selectedCrossSectionMm2 ?? 0;
    const longSection = long.selectedCrossSectionMm2 ?? 0;
    expect(longSection).toBeGreaterThanOrEqual(shortSection);
  });

  it("temperature correction decreases with heat", () => {
    expect(temperatureCorrection(25)).toBeGreaterThan(temperatureCorrection(50));
  });
});
