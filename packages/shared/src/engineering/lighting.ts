/**
 * محاسبه‌ی روشنایی داخلی (روش لومن) — مطابق مقررات ملی ساختمان مبحث ۱۳ و CIE.
 *
 *   N = (E · A) / (Φ · UF · MF)
 * که N تعداد چراغ، E سطح روشنایی موردنیاز (lux)، A مساحت (m²)، Φ شار نوری هر چراغ
 * (لومن)، UF ضریب بهره‌وری و MF ضریب نگهداری است.
 */

import { refs, LIGHTING_SPACES, type StandardNote } from "./standards.js";
import { clamp, round } from "./_common.js";

export interface LightingInput {
  /** مساحت فضا (m²) */
  areaM2: number;
  /** شناسه‌ی فضای استاندارد (سطح روشنایی توصیه‌شده از جدول می‌آید) */
  space?: string;
  /** سطح روشنایی دلخواه (lux) — اگر space داده شود نادیده گرفته می‌شود */
  customLux?: number;
  /** شار نوری هر چراغ (لومن) */
  lumensPerLuminaire: number;
  /** ضریب بهره‌وری (پیش‌فرض ۰.۶) */
  utilizationFactor?: number;
  /** ضریب نگهداری (پیش‌فرض ۰.۸) */
  maintenanceFactor?: number;
}

export interface LightingResult {
  /** سطح روشنایی هدف (lux) */
  targetLux: number;
  /** بازه‌ی مجاز lux (از جدول استاندارد) */
  minLux: number;
  spaceLabelFa: string | null;
  /** شار نوری کل لازم (لومن) */
  requiredLumens: number;
  /** تعداد چراغ لازم (گرد به بالا) */
  luminaireCount: number;
  /** توان تقریبی روشنایی بر پایه‌ی بهره‌ی نوری چراغ (lm/W) — در صورت ارائه */
  estimatedWattageW?: number;
  standards: StandardNote[];
}

export function interiorLighting(input: LightingInput): LightingResult {
  const spaceRow = LIGHTING_SPACES.find((s) => s.spaceId === input.space) ?? null;
  const targetLux = spaceRow?.recommendedLux ?? input.customLux ?? 300;
  const minLux = spaceRow?.minLux ?? targetLux * 0.6;
  const area = Math.max(input.areaM2, 0.01);
  const uf = clamp(input.utilizationFactor ?? 0.6, 0.3, 0.9);
  const mf = clamp(input.maintenanceFactor ?? 0.8, 0.5, 1);

  const requiredLumens = (targetLux * area) / (uf * mf);
  const perLuminaire = Math.max(input.lumensPerLuminaire, 1);
  const luminaireCount = Math.ceil(requiredLumens / perLuminaire);

  return {
    targetLux,
    minLux,
    spaceLabelFa: spaceRow?.labelFa ?? null,
    requiredLumens: round(requiredLumens, 0),
    luminaireCount,
    estimatedWattageW: round(luminaireCount * (perLuminaire / 90), 0), // ۹۰ lm/W بهره‌ی متعارف LED
    standards: refs(["M13", "CIE"]),
  };
}
