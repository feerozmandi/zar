import { describe, expect, it } from "vitest";
import {
  cellTemperatureC,
  configureStrings,
  designSystem,
  findModule,
  INVERTER_CATALOG,
  MODULE_CATALOG,
  selectInverter,
} from "./system.js";
import { inverterEfficiency } from "./production.js";
import { monthlyPoa } from "./production.js";
import { resourceForProvince } from "./climate.js";

const MODULE = findModule("mono-perc-550");
const TEHRAN = resourceForProvince("tehran");
const POA = monthlyPoa(TEHRAN, 35.7, 30, 180);

describe("انتخاب تجهیزات", () => {
  it("مدل نامعتبر به پیش‌فرض برمی‌گردد", () => {
    expect(findModule("نداریم").model).toBe(MODULE_CATALOG[0]?.model);
    expect(findModule("topcon-600").wattPmp).toBe(600);
  });

  it("اینورتر طوری انتخاب می‌شود که نسبت DC/AC نزدیک هدف باشد", () => {
    const choice = selectInverter(100, { targetDcAcRatio: 1.2 });
    expect(choice.dcAcRatio).toBeGreaterThan(0.9);
    expect(choice.dcAcRatio).toBeLessThan(1.6);
    expect(choice.count).toBeGreaterThanOrEqual(1);
    expect(INVERTER_CATALOG.some((inv) => inv.model === choice.spec.model)).toBe(true);
  });

  it("نسبت توانِ DC مجاز اینورتر رعایت می‌شود", () => {
    const choice = selectInverter(150, { targetDcAcRatio: 1.2, phases: 3 });
    expect(choice.dcAcRatio).toBeLessThanOrEqual(choice.spec.maxDcKw / choice.spec.acPowerKw + 0.05);
  });

  it("سیستم‌های کوچک‌تر از ۶ کیلووات تک‌فاز پیشنهاد می‌گیرند", () => {
    expect(selectInverter(4).spec.phases).toBe(1);
    expect(selectInverter(40).spec.phases).toBe(3);
  });
});

describe("رشته‌بندی", () => {
  it("تعداد ماژولِ رشته از ولتاژ مجاز عبور نمی‌کند", () => {
    const config = configureStrings({
      module: MODULE,
      inverter: INVERTER_CATALOG[1]!,
      panelCount: 60,
      minAmbientC: -10,
      maxCellC: 70,
    });
    expect(config.vocMinTempV).toBeLessThanOrEqual(INVERTER_CATALOG[1]!.maxDcVoltageV);
    expect(config.vocMinTempV).toBeLessThanOrEqual(MODULE.maxSystemVoltageV);
    expect(config.modulesPerString).toBeGreaterThan(0);
    expect(config.stringCount).toBeGreaterThan(0);
  });

  it("در سرمای شدید تعداد ماژولِ رشته کمتر می‌شود", () => {
    const mild = configureStrings({
      module: MODULE,
      inverter: INVERTER_CATALOG[1]!,
      panelCount: 60,
      minAmbientC: 0,
      maxCellC: 70,
    });
    const cold = configureStrings({
      module: MODULE,
      inverter: INVERTER_CATALOG[1]!,
      panelCount: 60,
      minAmbientC: -30,
      maxCellC: 70,
    });
    expect(cold.modulesPerString).toBeLessThanOrEqual(mild.modulesPerString);
  });

  it("باقیمانده‌ی ماژول‌ها گزارش می‌شود", () => {
    const config = configureStrings({
      module: MODULE,
      inverter: INVERTER_CATALOG[1]!,
      panelCount: 57,
      minAmbientC: -10,
      maxCellC: 70,
    });
    expect(config.unusedModules).toBe(57 % config.modulesPerString);
  });
});

describe("تراز تلفات", () => {
  const design = designSystem({
    latDeg: 35.7,
    module: MODULE,
    inverter: INVERTER_CATALOG[1]!,
    inverterCount: 4,
    panelCount: 60,
    weightedSolarAccess: 0.95,
    accessStdDev: 0.03,
    monthlyPoaKwhM2Day: POA,
    monthlyTempC: TEHRAN.monthlyTempC,
  });

  it("ضریب عملکرد در بازه‌ی واقع‌بینانه است", () => {
    expect(design.performanceRatio).toBeGreaterThan(0.7);
    expect(design.performanceRatio).toBeLessThan(0.9);
  });

  it("هر تلفات نام و مقدار دارد و مجموع با PR هم‌خوان است", () => {
    expect(design.losses.length).toBeGreaterThan(5);
    const product = design.losses.reduce((pr, loss) => pr * (1 - loss.lossFraction), 1);
    expect(product).toBeCloseTo(design.performanceRatio, 2);
    for (const loss of design.losses) {
      expect(loss.label.length).toBeGreaterThan(0);
      expect(loss.lossFraction).toBeGreaterThanOrEqual(0);
      expect(loss.lossFraction).toBeLessThan(0.3);
    }
  });

  it("دمای سلول در تابستان از زمستان بیشتر است", () => {
    expect(design.monthlyCellTempC[3] ?? 0).toBeGreaterThan(design.monthlyCellTempC[9] ?? 0);
  });

  it("ظرفیت و نسبت DC/AC محاسبه می‌شود", () => {
    expect(design.capacityKwp).toBeCloseTo(33, 1);
    expect(design.dcAcRatio).toBeGreaterThan(0);
  });

  it("سایه‌ی بیشتر PR را کم می‌کند", () => {
    const shaded = designSystem({
      latDeg: 35.7,
      module: MODULE,
      inverter: INVERTER_CATALOG[1]!,
      inverterCount: 4,
      panelCount: 60,
      weightedSolarAccess: 0.6,
      monthlyPoaKwhM2Day: POA,
      monthlyTempC: TEHRAN.monthlyTempC,
    });
    expect(shaded.performanceRatio).toBeLessThan(design.performanceRatio);
  });
});

describe("رفتارِ حرارتی و اینورتر", () => {
  it("دمای سلول با تابش و دمای محیط بالا می‌رود", () => {
    expect(cellTemperatureC(900, 35, 45)).toBeGreaterThan(cellTemperatureC(400, 20, 45));
    expect(cellTemperatureC(1000, 30, 45)).toBeGreaterThan(30);
  });

  it("بازده اینورتر در بارِ کم افت می‌کند", () => {
    const inverter = INVERTER_CATALOG[1]!;
    expect(inverterEfficiency(0.05, inverter)).toBeLessThan(inverterEfficiency(0.5, inverter));
    expect(inverterEfficiency(1, inverter)).toBeCloseTo(inverter.peakEfficiency, 3);
    expect(inverterEfficiency(0, inverter)).toBe(0);
  });
});
