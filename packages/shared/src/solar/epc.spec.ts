import { describe, expect, it } from "vitest";
import {
  DEFAULT_BID_WEIGHTS,
  evaluateBids,
  maskPhone,
  summarizeLead,
  type EpcBidInput,
} from "./epc.js";

const BIDS: EpcBidInput[] = [
  {
    id: "b1",
    partnerName: "ارزان‌سازه",
    totalPriceToman: 1_600_000_000,
    capacityKwp: 100,
    moduleTier: 3,
    productWarrantyYears: 5,
    performanceWarrantyPercent: 80,
    rating: 2.4,
    leadTimeDays: 300,
  },
  {
    id: "b2",
    partnerName: "پاک‌نیرو",
    totalPriceToman: 1_850_000_000,
    capacityKwp: 100,
    moduleTier: 1,
    productWarrantyYears: 15,
    performanceWarrantyPercent: 87,
    rating: 4.6,
    leadTimeDays: 120,
  },
  {
    id: "b3",
    partnerName: "صنعت‌سولار",
    totalPriceToman: 1_720_000_000,
    capacityKwp: 100,
    moduleTier: 2,
    productWarrantyYears: 12,
    performanceWarrantyPercent: 84,
    rating: 4.0,
    leadTimeDays: 180,
  },
];

describe("نرمال‌سازیِ پیشنهادها", () => {
  const evaluated = evaluateBids(BIDS);

  it("هزینه به ازای هر وات محاسبه می‌شود", () => {
    expect(evaluated[0]?.pricePerWattToman).toBeGreaterThan(0);
    const cheapest = evaluated.find((bid) => bid.partnerName === "ارزان‌سازه");
    expect(cheapest?.pricePerWattToman).toBe(16_000);
  });

  it("ارزان‌ترین لزوماً بهترین ارزش نیست", () => {
    expect(evaluated[0]?.isBestValue).toBe(true);
    expect(evaluated[0]?.partnerName).not.toBe("ارزان‌سازه");
  });

  it("رتبه‌ها پیوسته و امتیازها نزولی‌اند", () => {
    evaluated.forEach((bid, index) => {
      expect(bid.rank).toBe(index + 1);
      if (index > 0) {
        expect(bid.scores.total).toBeLessThanOrEqual(evaluated[index - 1]?.scores.total ?? 0);
      }
    });
  });

  it("اختلافِ قیمت با ارزان‌ترین گزارش می‌شود", () => {
    const cheapest = evaluated.find((bid) => bid.partnerName === "ارزان‌سازه");
    expect(cheapest?.priceDeltaVsCheapestPercent).toBe(0);
    const best = evaluated.find((bid) => bid.partnerName === "پاک‌نیرو");
    expect(best?.priceDeltaVsCheapestPercent ?? 0).toBeGreaterThan(0);
  });

  it("هشدارهای کیفی برای پیشنهادِ ضعیف تولید می‌شود", () => {
    const weak = evaluated.find((bid) => bid.partnerName === "ارزان‌سازه");
    expect(weak?.warnings.length ?? 0).toBeGreaterThan(0);
  });

  it("پیشنهادِ باکیفیت هشدار ندارد", () => {
    const strong = evaluated.find((bid) => bid.partnerName === "پاک‌نیرو");
    expect(strong?.warnings).toEqual([]);
  });

  it("وزنِ بالاترِ قیمت، انتخاب را به سمتِ ارزان‌ترین می‌برد", () => {
    const priceFirst = evaluateBids(BIDS, { ...DEFAULT_BID_WEIGHTS, price: 0.95, rating: 0.01, equipment: 0.01, warranty: 0.01, schedule: 0.02 });
    expect(priceFirst[0]?.partnerName).toBe("ارزان‌سازه");
  });

  it("فهرستِ خروجی برای جدولِ مقایسه کامل است", () => {
    for (const bid of evaluated) {
      expect(bid.capacityKwp).toBe(100);
      expect(bid.scores.total).toBeGreaterThan(0);
      expect(bid.scores.total).toBeLessThanOrEqual(1);
    }
  });

  it("بدون پیشنهاد خروجی تهی است", () => {
    expect(evaluateBids([])).toEqual([]);
  });
});

describe("حریمِ مشتری در مارکت‌پلیس", () => {
  it("شماره تلفن پوشانده می‌شود", () => {
    expect(maskPhone("09123456789")).toBe("0912•••89");
    expect(maskPhone("912")).toBe("•••");
  });

  it("خلاصه‌ی درخواست برای پیمانکاران ناشناس است", () => {
    const summary = summarizeLead({
      requestId: "req-1",
      province: "tehran",
      capacityKwp: 100,
      annualConsumptionKwh: 240_000,
      annualProductionKwh: 160_000,
      contactName: "علی احمدی",
      contactPhone: "09123456789",
      createdAt: new Date("2026-01-01T00:00:00Z"),
    });
    expect(summary.contactMasked.phone).toBe("0912•••89");
    expect(summary.contactMasked.name).not.toContain("احمدی");
    expect(summary.mounting).toBe("roof");
    expect(summary.createdAtIso).toBe("2026-01-01T00:00:00.000Z");
  });
});
