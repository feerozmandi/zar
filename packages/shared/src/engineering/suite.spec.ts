import { describe, expect, it } from "vitest";
import { calculateDemand } from "./demand.js";
import { calculateShortCircuit } from "./short-circuit.js";
import { sizeTransformer } from "./transformer.js";
import { selectSwitchgear } from "./switchgear.js";
import { sizeBusbar } from "./busbar.js";
import { voltageClassInfo } from "./voltage-classes.js";
import { earthElectrodeResistance } from "./earthing.js";
import { interiorLighting } from "./lighting.js";
import { calculateVoltageDrop } from "./voltage-drop.js";
import { sizeCapacitorBank } from "./capacitor-bank.js";
import { sizeGenerator } from "./generator.js";
import { refs, STANDARD_LIBRARY } from "./standards.js";

/** همه‌ی نتایج محاسبات باید پیوست استاندارد (غیرخالی) داشته باشند */
function expectStandards(result: unknown): void {
  const r = result as { standards: unknown[] };
  expect(Array.isArray(r.standards)).toBe(true);
  expect(r.standards.length).toBeGreaterThan(0);
}

describe("engineering suite — استاندارد پیوست در همه‌ی ابزارها", () => {
  it("refs returns known standard entries only", () => {
    const notes = refs(["IEC60038", "PUB110", "NOT_EXIST"]);
    expect(notes.map((n) => n.code)).toEqual(["IEC 60038", "نشریه ۱۱۰"]);
    expect(Object.keys(STANDARD_LIBRARY).length).toBeGreaterThan(5);
  });

  it("voltage drop appends standards", () => {
    expectStandards(calculateVoltageDrop({ system: "three", voltage: 400, current: 50, length: 100 }));
  });

  it("capacitor bank appends standards and penalty flag", () => {
    const r = sizeCapacitorBank({ activePowerKw: 200, cosPhiBefore: 0.78, cosPhiTarget: 0.95 });
    expect(r.cosPhiAfter).toBeGreaterThan(0.78);
    expect(r.abovePenaltyThreshold).toBe(true);
    expectStandards(r);
  });

  it("generator appends standards and exposes series", () => {
    const r = sizeGenerator({ connectedLoadKw: 180 });
    expect(r.availableSizesKva).toContain(180);
    expectStandards(r);
  });
});

describe("demand & diversity", () => {
  it("computes coincident demand with demand factors", () => {
    const r = calculateDemand({
      loads: [
        { label: "روشنایی", kw: 10, category: "lighting" },
        { label: "پریز", kw: 20, category: "socket" },
        { label: "موتور", kw: 30, category: "motor" },
      ],
    });
    expect(r.totalConnectedKw).toBe(60);
    expect(r.coincidentDemandKw).toBeLessThan(r.sumDemandKw);
    expect(r.demandCurrentA).toBeGreaterThan(0);
    expectStandards(r);
  });
});

describe("short-circuit (IEC 60909)", () => {
  it("computes fault MVA and peak, and picks breaker", () => {
    const r = calculateShortCircuit({ voltageLevel: "mv", nominalVoltageKv: 20, iKKA: 16 });
    expect(r.faultMva).toBeCloseTo(Math.sqrt(3) * 20 * 16, 0);
    expect(r.peakKA).toBeGreaterThan(r.iKKA);
    expect(r.withinBreakingCapacity).toBe(true);
    expectStandards(r);
  });
});

describe("transformer sizing (IEC 60076)", () => {
  it("snaps to standard kVA and reports secondary fault level", () => {
    const r = sizeTransformer({ demandKva: 550 });
    expect(r.selectedKva).toBeGreaterThanOrEqual(550);
    expect(r.secondaryFaultKA).toBeGreaterThan(0);
    expectStandards(r);
  });
});

describe("switchgear selection", () => {
  it("selects breaker current and breaking capacity", () => {
    const r = selectSwitchgear({
      voltageLevel: "lv",
      nominalVoltageKv: 0.4,
      loadCurrentA: 300,
      faultLevelKA: 22,
    });
    expect(r.ratedCurrentA).toBeGreaterThanOrEqual(300);
    expect(r.breakingCapacityKA).toBeGreaterThanOrEqual(22);
    expect(r.withinCapacity).toBe(true);
    expectStandards(r);
  });
});

describe("busbar sizing", () => {
  it("chooses standard bar section for current", () => {
    const r = sizeBusbar({ currentA: 400, material: "copper" });
    expect(r.selectedCrossSectionMm2).toBeGreaterThanOrEqual(r.requiredCrossSectionMm2);
    expect(r.sufficient).toBe(true);
    expectStandards(r);
  });
});

describe("voltage class reference", () => {
  it("returns equipment ratings for 20 kV Iranian distribution", () => {
    const r = voltageClassInfo(20);
    expect(r.selected?.umKv).toBe(24);
    expect(r.selected?.lightningImpulseKv).toBe(125);
    expectStandards(r);
  });
});

describe("earthing", () => {
  it("computes electrode resistance and compliance", () => {
    const r = earthElectrodeResistance({ soil: { rhoOhmM: 100 }, rodLengthM: 2.5, rodCount: 2 });
    expect(r.singleRodOhm).toBeGreaterThan(0);
    expect(r.totalOhm).toBeLessThan(r.singleRodOhm);
    expectStandards(r);
  });
});

describe("interior lighting", () => {
  it("returns luminaire count via lumen method", () => {
    const r = interiorLighting({ areaM2: 100, space: "office", lumensPerLuminaire: 10000 });
    expect(r.targetLux).toBe(500);
    expect(r.luminaireCount).toBeGreaterThan(0);
    expectStandards(r);
  });
});
