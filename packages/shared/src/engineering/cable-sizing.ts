import { calculateVoltageDrop } from "./voltage-drop.js";

/**
 * سایزینگ کابل: انتخاب کوچک‌ترین مقطع استاندارد که هم حد جریان (ampacity) و
 * هم حد افت ولتاژ را رعایت کند. جداول زیر بر پایه‌ی IEC 60364-5-52 تنظیم شده‌اند
 * و در فاز ۳ باید با مقادیر دقیق نشریه ۱۱۰ (جدول ۱۱-۲ تا ۱۱-۴) بازبینی شوند.
 */

export const STANDARD_CROSS_SECTIONS_MM2 = [
  1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300,
] as const;

/** ظرفیت جریان مجاز مس در هوا (آمپر) به ازای مقطع */
const COPPER_AIR_A: Record<string, number> = {
  "1.5": 22,
  "2.5": 30,
  "4": 40,
  "6": 51,
  "10": 70,
  "16": 92,
  "25": 115,
  "35": 138,
  "50": 164,
  "70": 200,
  "95": 240,
  "120": 270,
  "150": 312,
  "185": 353,
  "240": 415,
  "300": 479,
};

const INSTALLATION_DERATING: Record<string, number> = {
  clip: 1,
  conduit: 0.8,
  tray: 0.88,
  buried: 0.92,
};

export interface CableSizingInput {
  system: "single" | "three";
  voltage: number;
  current: number;
  length: number;
  conductor?: "copper" | "aluminium";
  installationMethod?: keyof typeof INSTALLATION_DERATING;
  ambientTempC?: number;
  maxDropPercent?: number;
  powerFactor?: number;
}

export interface CableSizingResult {
  selectedCrossSectionMm2: number | null;
  ampacityAfterCorrections: number;
  voltageDropPercent: number;
  withinDropLimit: boolean;
  withinAmpacityLimit: boolean;
  correctionTemperature: number;
  correctionInstallation: number;
  candidates: Array<{ crossSectionMm2: number; ampacity: number; dropPercent: number }>;
  /** اگر هیچ مقطع استانداردی پاسخگو نبود، پیشنهاد تقسیم بار یا افزایش مقطع */
  adviceFa: string | null;
}

/** ضریب اصلاح دما برای عایق PVC — k = √((70 − Tamb) / (70 − 30)) */
export function temperatureCorrection(ambientTempC: number): number {
  const ratio = (70 - ambientTempC) / (70 - 30);
  return Math.min(1.25, Math.max(0.55, Math.sqrt(Math.max(ratio, 0.01))));
}

export function sizeCable(input: CableSizingInput): CableSizingResult {
  const conductor = input.conductor ?? "copper";
  const kT = temperatureCorrection(input.ambientTempC ?? 35);
  const kI = INSTALLATION_DERATING[input.installationMethod ?? "tray"] ?? 0.88;
  const maxDrop = input.maxDropPercent ?? 4;
  const conductivity = conductor === "copper" ? 56 : 34.5;

  const candidates = STANDARD_CROSS_SECTIONS_MM2.map((section) => {
    const base = COPPER_AIR_A[String(section)] ?? section * 1.6 + 20;
    const ampacity = conductor === "copper" ? base * kT * kI : base * 0.78 * kT * kI;
    const drop = calculateVoltageDrop({
      system: input.system,
      voltage: input.voltage,
      current: input.current,
      length: input.length,
      conductivity,
      powerFactor: input.powerFactor ?? 0.85,
    });
    // drop برای مقطع ۱mm² محاسبه شده؛ با تقسیم بر مقطع، خطی مقیاس می‌شود
    return {
      crossSectionMm2: section,
      ampacity: Math.round(ampacity * 10) / 10,
      dropPercent: Math.round((drop.dropPercent / section) * 100) / 100,
    };
  });

  const chosen = candidates.find(
    (candidate) => candidate.ampacity >= input.current && candidate.dropPercent <= maxDrop,
  );

  return {
    selectedCrossSectionMm2: chosen?.crossSectionMm2 ?? null,
    ampacityAfterCorrections: chosen?.ampacity ?? 0,
    voltageDropPercent: chosen?.dropPercent ?? Number.POSITIVE_INFINITY,
    withinDropLimit: Boolean(chosen),
    withinAmpacityLimit: Boolean(chosen),
    correctionTemperature: Math.round(kT * 1000) / 1000,
    correctionInstallation: kI,
    candidates,
    adviceFa: chosen
      ? null
      : `هیچ مقطع استانداردی با حدود داده‌شده پاسخگو نیست؛ مسیر را کوتاه/تقسیم کنید یا حد افت ولتاژ را بازبینی نمایید.`,
  };
}
