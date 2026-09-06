import { describe, expect, it } from "vitest";
import { calculateVoltageDrop } from "./voltage-drop.js";
import { sizeCapacitorBank } from "./capacitor-bank.js";
import { sizeGenerator } from "./generator.js";

describe("engineering suite", () => {
  it("voltage drop grows with length", () => {
    const shortRun = calculateVoltageDrop({ system: "three", voltage: 400, current: 100, length: 40 });
    const longRun = calculateVoltageDrop({ system: "three", voltage: 400, current: 100, length: 400 });
    expect(longRun.dropVolt).toBeGreaterThan(shortRun.dropVolt);
    expect(longRun.withinLimit).toBe(false);
  });

  it("capacitor bank improves power factor", () => {
    const bank = sizeCapacitorBank({ activePowerKw: 200, cosPhiBefore: 0.78, cosPhiTarget: 0.95 });
    expect(bank.requiredKvar).toBeGreaterThan(0);
    expect(bank.cosPhiAfter).toBeGreaterThan(0.78);
  });

  it("generator sizing snaps to standard sizes", () => {
    const gen = sizeGenerator({ connectedLoadKw: 180 });
    expect(gen.recommendedSizeLabel).toMatch(/kVA$/);
    expect(gen.recommendedKva).toBeLessThanOrEqual(Number(gen.recommendedSizeLabel.split(" ")[0]));
  });
});
