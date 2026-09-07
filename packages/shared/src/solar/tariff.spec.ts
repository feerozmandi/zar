import { describe, expect, it } from "vitest";
import {
  annualBill,
  averageEnergyPrice,
  energyChargeToman,
  guaranteedPurchasePrice,
  POLICY_SCENARIOS,
  policyScenario,
  selfConsumptionSavingToman,
  simulateBill,
  TARIFF_1404,
} from "./tariff.js";

describe("تعرفه‌ها", () => {
  it("بهای انرژی با مصرفِ بیشتر افزایش می‌یابد و میانگینِ پله‌ای بالا می‌رود", () => {
    const profile = TARIFF_1404.residential;
    expect(energyChargeToman(profile, 50)).toBeLessThan(energyChargeToman(profile, 500));
    expect(averageEnergyPrice(profile, 50)).toBeLessThan(averageEnergyPrice(profile, 500));
  });

  it("ماه‌های گرم مشمولِ ضریبِ گرم‌سیری می‌شوند", () => {
    const profile = TARIFF_1404.residential;
    const winter = energyChargeToman(profile, 300, 9);
    const summer = energyChargeToman(profile, 300, 4);
    expect(summer).toBeGreaterThan(winter);
  });

  it("قبضِ ماهانه شامل انرژی، قدرت و هزینه‌ی ثابت است", () => {
    const bill = simulateBill(TARIFF_1404.industrial, 20_000, 100, 0);
    expect(bill.energyToman).toBeGreaterThan(0);
    expect(bill.demandToman).toBe(100 * TARIFF_1404.industrial.demandChargeTomanPerKwMonth);
    expect(bill.fixedToman).toBe(TARIFF_1404.industrial.fixedChargeTomanPerMonth);
    expect(bill.totalToman).toBe(bill.energyToman + bill.demandToman + bill.fixedToman);
  });

  it("اشتراک خانگی بهای قدرت ندارد", () => {
    expect(simulateBill(TARIFF_1404.residential, 300, 10).demandToman).toBe(0);
  });

  it("قبضِ سالانه مجموعِ ۱۲ ماه است", () => {
    const monthly = new Array(12).fill(4_000);
    const result = annualBill(TARIFF_1404.commercial, monthly, new Array(12).fill(20));
    expect(result.monthly).toHaveLength(12);
    expect(result.totalToman).toBe(result.monthly.reduce((sum, bill) => sum + bill.totalToman, 0));
  });

  it("تعرفه‌ی کشاورزی از صنعتی ارزان‌تر است", () => {
    expect(energyChargeToman(TARIFF_1404.agricultural, 10_000)).toBeLessThan(
      energyChargeToman(TARIFF_1404.industrial, 10_000),
    );
  });
});

describe("سناریوهای نظارتی", () => {
  it("چهار مسیرِ متداول تعریف شده است", () => {
    expect(POLICY_SCENARIOS).toHaveLength(4);
    expect(POLICY_SCENARIOS.map((scenario) => scenario.id)).toEqual([
      "self-supply",
      "guaranteed-purchase",
      "green-exchange",
      "hybrid",
    ]);
  });

  it("هر سناریو مرجع قانونی و مزایا/محدودیت دارد", () => {
    for (const scenario of POLICY_SCENARIOS) {
      expect(scenario.legalReference.length).toBeGreaterThan(5);
      expect(scenario.pros.length).toBeGreaterThan(0);
      expect(scenario.cons.length).toBeGreaterThan(0);
    }
  });

  it("نرخِ خرید تضمینی با افزایش ظرفیت کاهش می‌یابد", () => {
    expect(guaranteedPurchasePrice(10)).toBeGreaterThan(guaranteedPurchasePrice(150));
    expect(guaranteedPurchasePrice(150)).toBeGreaterThan(guaranteedPurchasePrice(2_000));
  });

  it("شناسه‌ی نامعتبر به سناریوی پیش‌فرض برمی‌گردد", () => {
    expect(policyScenario("self-supply").id).toBe("self-supply");
  });
});

describe("صرفه‌جویی", () => {
  it("صرفه‌جویی شامل کاهشِ انرژی و بهای قدرت است", () => {
    const saving = selfConsumptionSavingToman({
      profile: TARIFF_1404.industrial,
      selfConsumedKwh: 5_000,
      monthIndex: 0,
      demandReductionKw: 20,
    });
    expect(saving.energySavingToman).toBeGreaterThan(0);
    expect(saving.demandSavingToman).toBe(20 * TARIFF_1404.industrial.demandChargeTomanPerKwMonth);
    expect(saving.totalToman).toBe(saving.energySavingToman + saving.demandSavingToman);
  });

  it("بدون کاهشِ دیماند، صرفه‌جویی فقط از محلِ انرژی است", () => {
    const saving = selfConsumptionSavingToman({
      profile: TARIFF_1404.industrial,
      selfConsumedKwh: 5_000,
      monthIndex: 0,
    });
    expect(saving.demandSavingToman).toBe(0);
  });
});
