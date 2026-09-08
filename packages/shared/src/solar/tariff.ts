/**
 * تعرفه‌های برق ایران و سناریوهای نظارتیِ فروش برق خورشیدی.
 *
 * ⚠️ سیاست داده — دقیقاً همان قاعده‌ی `climate.ts` و `cost.ts`:
 * اعداد زیر «مبانی پیش‌فرضِ سال ۱۴۰۴» هستند که از تعرفه‌های ابلاغیِ توانیر و
 * نرخ‌های اعلامیِ ساتبا/بورس انرژی الهام گرفته‌اند و برای نمونه‌سازی کافی‌اند،
 * اما باید از جدول `TariffRate` (موجود در ماژول ممیزی) و `SolarPolicyPreset`
 * خوانده شوند. هیچ محاسبه‌ی مالی‌ای بدون درجِ این مفروضات در گزارش انجام نمی‌شود.
 *
 * ماه‌ها با شروع از **فروردین** شماره‌گذاری می‌شوند (اندیس ۰ تا ۱۱).
 */

export type TariffKind = "residential" | "commercial" | "industrial" | "agricultural" | "governmental";

export interface TariffBlock {
  /** سقفِ پله (kWh در ماه)؛ null = پله‌ی آخر */
  upToKwh: number | null;
  /** بهای انرژی (تومان به ازای هر کیلووات‌ساعت) */
  priceTomanPerKwh: number;
}

export interface TariffProfile {
  kind: TariffKind;
  label: string;
  blocks: TariffBlock[];
  /** بهای قدرت (تومان به ازای هر کیلووات در ماه) */
  demandChargeTomanPerKwMonth: number;
  /** هزینه‌ی ثابت ماهانه (تومان) */
  fixedChargeTomanPerMonth: number;
  /** ضریبِ گرم‌سیری برای ماه‌های تیر، مرداد و شهریور (اندیس ۳ تا ۵) */
  warmSeasonMultiplier: number;
  notes: string;
}

export const TARIFF_1404: Record<TariffKind, TariffProfile> = {
  residential: {
    kind: "residential",
    label: "خانگی",
    blocks: [
      { upToKwh: 100, priceTomanPerKwh: 1_130 },
      { upToKwh: 200, priceTomanPerKwh: 1_410 },
      { upToKwh: 300, priceTomanPerKwh: 2_930 },
      { upToKwh: 400, priceTomanPerKwh: 5_270 },
      { upToKwh: 500, priceTomanPerKwh: 7_650 },
      { upToKwh: 600, priceTomanPerKwh: 9_760 },
      { upToKwh: null, priceTomanPerKwh: 11_900 },
    ],
    demandChargeTomanPerKwMonth: 0,
    fixedChargeTomanPerMonth: 12_000,
    warmSeasonMultiplier: 1.15,
    notes: "پله‌ایِ افزایشی؛ ماه‌های گرم مشمول ضریب ۱٫۱۵",
  },
  commercial: {
    kind: "commercial",
    label: "تجاری",
    blocks: [
      { upToKwh: 1_000, priceTomanPerKwh: 3_900 },
      { upToKwh: 5_000, priceTomanPerKwh: 4_600 },
      { upToKwh: null, priceTomanPerKwh: 5_200 },
    ],
    demandChargeTomanPerKwMonth: 21_000,
    fixedChargeTomanPerMonth: 45_000,
    warmSeasonMultiplier: 1.1,
    notes: "دارای بهای قدرت؛ اوجِ مصرف در ساعات اداری",
  },
  industrial: {
    kind: "industrial",
    label: "صنعتی",
    blocks: [
      { upToKwh: 5_000, priceTomanPerKwh: 2_400 },
      { upToKwh: 20_000, priceTomanPerKwh: 2_900 },
      { upToKwh: null, priceTomanPerKwh: 3_300 },
    ],
    demandChargeTomanPerKwMonth: 27_000,
    fixedChargeTomanPerMonth: 90_000,
    warmSeasonMultiplier: 1.1,
    notes: "بهای قدرت سهم مهمی از قبض دارد؛ کاهشِ پیک با خورشید بسیار اثرگذار است",
  },
  agricultural: {
    kind: "agricultural",
    label: "کشاورزی",
    blocks: [{ upToKwh: null, priceTomanPerKwh: 700 }],
    demandChargeTomanPerKwMonth: 5_000,
    fixedChargeTomanPerMonth: 15_000,
    warmSeasonMultiplier: 1.0,
    notes: "تعرفه‌ی یارانه‌ای؛ توجیه اقتصادی صرفاً از محلِ کاهشِ مصرف است",
  },
  governmental: {
    kind: "governmental",
    label: "اداری/دولتی",
    blocks: [
      { upToKwh: 3_000, priceTomanPerKwh: 3_200 },
      { upToKwh: null, priceTomanPerKwh: 3_900 },
    ],
    demandChargeTomanPerKwMonth: 15_000,
    fixedChargeTomanPerMonth: 40_000,
    warmSeasonMultiplier: 1.1,
    notes: "مشابه تجاری با قدرتِ کمتر",
  },
};

/** ماه‌های گرم (تیر، مرداد، شهریور) */
export const WARM_MONTHS = [3, 4, 5] as const;

/** بهای انرژیِ پله‌ای برای یک مصرف ماهانه (تومان) */
export function energyChargeToman(profile: TariffProfile, monthlyKwh: number, monthIndex = 0): number {
  const seasonal = WARM_MONTHS.includes(monthIndex as (typeof WARM_MONTHS)[number])
    ? profile.warmSeasonMultiplier
    : 1;
  let remaining = Math.max(0, monthlyKwh);
  let previousLimit = 0;
  let total = 0;

  for (const block of profile.blocks) {
    const capacity = block.upToKwh === null ? Number.POSITIVE_INFINITY : block.upToKwh - previousLimit;
    const consumed = Math.min(remaining, capacity);
    if (consumed <= 0) break;
    total += consumed * block.priceTomanPerKwh * seasonal;
    remaining -= consumed;
    previousLimit = block.upToKwh ?? previousLimit;
    if (remaining <= 0) break;
  }
  return Math.round(total);
}

/** میانگینِ بهای هر کیلووات‌ساعت در یک ماه (برای نمایش در UI) */
export function averageEnergyPrice(profile: TariffProfile, monthlyKwh: number, monthIndex = 0): number {
  if (monthlyKwh <= 0) return 0;
  return Math.round(energyChargeToman(profile, monthlyKwh, monthIndex) / monthlyKwh);
}

export interface BillBreakdown {
  energyToman: number;
  demandToman: number;
  fixedToman: number;
  totalToman: number;
}

/** شبیه‌سازیِ یک قبض ماهانه */
export function simulateBill(
  profile: TariffProfile,
  monthlyKwh: number,
  peakDemandKw = 0,
  monthIndex = 0,
): BillBreakdown {
  const energy = energyChargeToman(profile, monthlyKwh, monthIndex);
  const demand = Math.round(peakDemandKw * profile.demandChargeTomanPerKwMonth);
  const fixed = profile.fixedChargeTomanPerMonth;
  return { energyToman: energy, demandToman: demand, fixedToman: fixed, totalToman: energy + demand + fixed };
}

/** قبضِ سالانه با پروفایلِ مصرف ماهانه */
export function annualBill(
  profile: TariffProfile,
  monthlyKwh: readonly number[],
  monthlyPeakDemandKw: readonly number[] = [],
): { monthly: BillBreakdown[]; totalToman: number } {
  const monthly = Array.from({ length: 12 }, (_, index) =>
    simulateBill(profile, monthlyKwh[index] ?? 0, monthlyPeakDemandKw[index] ?? 0, index),
  );
  return {
    monthly,
    totalToman: monthly.reduce((sum, bill) => sum + bill.totalToman, 0),
  };
}

// ───────────────────────── سناریوهای نظارتی ─────────────────────────

export type PolicyScenarioId = "self-supply" | "guaranteed-purchase" | "green-exchange" | "hybrid";

export interface PolicyScenario {
  id: PolicyScenarioId;
  label: string;
  legalReference: string;
  description: string;
  /** آیا درآمدِ صادرات دارد؟ */
  exportsEnergy: boolean;
  /** پیش‌فرضِ نرخِ فروش (تومان/kWh) — برای سناریوی صادراتی */
  defaultExportPriceTomanPerKwh?: number;
  /** پیش‌فرضِ نرخِ جایگزینیِ مصرف (تومان/kWh) — صرفه‌جوییِ قبض */
  defaultOffsetPriceTomanPerKwh?: number;
  /** مزایا و محدودیت‌ها برای نمایش در گزارش */
  pros: string[];
  cons: string[];
}

/**
 * چهار مسیرِ متداولِ توسعه‌ی نیروگاه خورشیدی در ایران.
 * نرخ‌ها پیش‌فرض‌اند و باید از `SolarPolicyPreset` پایگاه‌داده به‌روز شوند.
 */
export const POLICY_SCENARIOS: readonly PolicyScenario[] = [
  {
    id: "self-supply",
    label: "خودتأمین (ماده ۱۶)",
    legalReference: "ماده ۱۶ آیین‌نامه اجرایی قانون جهش تولید دانش‌بنیان و اصلاحات بعدی",
    description:
      "نیروگاه پشت کنتورِ مشترک نصب می‌شود و انرژی عمدتاً در محل مصرف جایگزین می‌گردد؛ مازادِ لحظه‌ای به شبکه تحویل می‌شود.",
    exportsEnergy: false,
    defaultOffsetPriceTomanPerKwh: 3_600,
    /** تسویه‌ی مازادِ تحویلی به شبکه در الگوی پشت‌کنتوری */
    defaultExportPriceTomanPerKwh: 2_500,
    pros: [
      "بیشترین ارزش به ازای هر کیلووات‌ساعت (جایگزینیِ تعرفه‌ی خرده‌فروشی)",
      "کاهشِ هم‌زمانِ بهای قدرت (دیماند) در اشتراک‌های صنعتی/تجاری",
      "فرآیندِ اداریِ کوتاه‌تر نسبت به قراردادِ خرید تضمینی",
    ],
    cons: [
      "ارزشِ مازادِ تحویلی معمولاً با نرخِ پایین‌تری تسویه می‌شود",
      "نیازمند تطبیقِ پروفایلِ تولید با بار (بدون باتری محدودیت دارد)",
    ],
  },
  {
    id: "guaranteed-purchase",
    label: "خرید تضمینی (ماده ۱۲)",
    legalReference: "ماده ۱۲ قانون رفع موانع تولید رقابت‌پذیر — قرارداد ۲۰ ساله با ساتبا",
    description:
      "کلِ انرژی تولیدی با نرخِ مصوب و تضمینِ دولتی خریداری می‌شود؛ نرخ به ظرفیتِ نیروگاه وابسته است.",
    exportsEnergy: true,
    defaultExportPriceTomanPerKwh: 11_000,
    pros: ["جریان نقدیِ پایدار و قابل پیش‌بینی در ۲۰ سال", "تضمینِ خرید توسط دولت و ریسکِ پایینِ طرفِ مقابل"],
    cons: [
      "نیازمند مجوز، قرارداد و فرآیندِ اداریِ طولانی",
      "نرخِ اسمی معمولاً ثابت است و با تورم تعدیل محدودی دارد",
    ],
  },
  {
    id: "green-exchange",
    label: "فروش در بورس سبز",
    legalReference: "بورس انرژی ایران — تابلوی برق سبز",
    description: "انرژی (و گواهیِ تولید پاک) در بازار عرضه و با قیمتِ توافقی فروخته می‌شود.",
    exportsEnergy: true,
    defaultExportPriceTomanPerKwh: 7_500,
    pros: ["امکان فروش با نرخِ بالاتر از میانگین در صورت تقاضای خوبِ صنایع", "تسویه‌ی نسبتاً سریع"],
    cons: ["نوسانِ قیمت و عدم قطعیتِ درآمد", "ریسکِ خریدار و هزینه‌های معاملاتی"],
  },
  {
    id: "hybrid",
    label: "ترکیبی (خودمصرفی + فروش مازاد)",
    legalReference: "ترکیبِ خودتأمین و عرضه در بازار/تضمینی",
    description:
      "بخشی از تولید در محل مصرف می‌شود و مازاد بر اساسِ نرخِ بازار یا قرارداد فروخته می‌شود — متداول‌ترین الگوی صنعتی.",
    exportsEnergy: true,
    defaultExportPriceTomanPerKwh: 7_500,
    defaultOffsetPriceTomanPerKwh: 3_600,
    pros: ["بیشینه‌سازیِ ارزش با اولویتِ جایگزینیِ مصرف", "انعطاف در برابر تغییرِ مقررات"],
    cons: ["پیچیدگیِ قراردادی و نیاز به کنتور و پایشِ دقیق"],
  },
];

export function policyScenario(id: PolicyScenarioId): PolicyScenario {
  return POLICY_SCENARIOS.find((scenario) => scenario.id === id) ?? POLICY_SCENARIOS[0]!;
}

/**
 * نرخِ خرید تضمینی بر اساس ظرفیت — نرخِ پلکانیِ ساتبا (پیش‌فرض؛ قابلِ ویرایش).
 */
export function guaranteedPurchasePrice(capacityKwp: number): number {
  if (capacityKwp <= 20) return 12_500;
  if (capacityKwp <= 100) return 11_000;
  if (capacityKwp <= 1_000) return 9_500;
  return 8_500;
}

/**
 * صرفه‌جوییِ ماهانه‌ی ناشی از خودمصرفی: انرژیِ جایگزین‌شده به نرخِ تعرفه
 * به‌علاوه‌ی کاهشِ بهای قدرت متناسب با سهمِ تولید از پیکِ مصرف.
 */
export function selfConsumptionSavingToman(options: {
  profile: TariffProfile;
  selfConsumedKwh: number;
  monthIndex: number;
  /** دیماندِ کاهش‌یافته (کیلووات) */
  demandReductionKw?: number;
}): { energySavingToman: number; demandSavingToman: number; totalToman: number } {
  const { profile, selfConsumedKwh, monthIndex } = options;
  const energySaving = energyChargeToman(profile, selfConsumedKwh, monthIndex);
  const demandSaving = Math.round((options.demandReductionKw ?? 0) * profile.demandChargeTomanPerKwMonth);
  return {
    energySavingToman: energySaving,
    demandSavingToman: demandSaving,
    totalToman: energySaving + demandSaving,
  };
}
