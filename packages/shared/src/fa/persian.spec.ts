import { describe, expect, it } from "vitest";
import { formatNumber, formatToman, toJalali, toLatinDigits, toPersianDigits } from "./persian.js";

describe("persian utils", () => {
  it("digits round-trip", () => {
    expect(toPersianDigits(2026)).toBe("۲۰۲۶");
    expect(toLatinDigits("۱۲۳")).toBe("123");
  });

  it("thousand separators", () => {
    expect(formatNumber(12500)).toMatch(/۱۲/);
    expect(formatToman(12500)).toContain("تومان");
  });

  it("jalali conversion", () => {
    expect(toJalali(new Date(Date.UTC(2026, 8, 4, 12)))).toMatchObject({ jy: 1405, jm: 6 });
  });
});
