/**
 * مارکت‌پلیسِ مناقصه‌ی معکوس (EnergySage Model) — نرمال‌سازی و امتیازدهیِ پیشنهادها.
 *
 * مسئله: پیشنهادهای پیمانکاران با هم قابل مقایسه نیستند — یکی با پنل Tier-1 و گارانتی
 * ۲۵ ساله گران‌تر است، دیگری ارزان‌تر اما تحویلش ۹ ماه است. اینجا همه‌ی پیشنهادها به
 * «هزینه به ازای هر وات» نرمال و با وزن‌دهیِ شفاف (قیمت، تجهیزات، گارانتی، رتبه،
 * زمان‌بندی) امتیازدهی می‌شوند تا مقایسه‌ی کنارِ‌هم معنا پیدا کند.
 *
 * حریمِ مشتری: تا پیش از پذیرشِ پیشنهاد، اطلاعات تماس برای پیمانکار پوشانده می‌شود
 * (مشابه EnergySage که درخواست را به‌صورت ناشناس برای نصاب‌ها می‌فرستد).
 */

export interface EpcBidInput {
  id?: string;
  /** نام حقوقی یا برندِ پیمانکار */
  partnerName: string;
  /** مبلغ کلِ پیشنهاد (تومان) */
  totalPriceToman: number;
  /** ظرفیتی که پیمانکار پیشنهاد می‌دهد (kWp) */
  capacityKwp: number;
  moduleBrand?: string;
  /** رده‌ی تولیدکننده‌ی پنل */
  moduleTier?: 1 | 2 | 3;
  inverterBrand?: string;
  /** گارانتی محصول (سال) */
  productWarrantyYears?: number;
  /** تضمینِ عملکرد در سال ۲۵ (درصد توانِ باقی‌مانده) */
  performanceWarrantyPercent?: number;
  /** امتیازِ کارفرمایانِ قبلی (۰ تا ۵) */
  rating?: number;
  /** زمان تحویل و راه‌اندازی (روز) */
  leadTimeDays?: number;
  /** سال‌های بهره‌برداریِ شاملِ قرارداد */
  oAndMYears?: number;
  notes?: string;
}

export interface BidScores {
  price: number;
  equipment: number;
  warranty: number;
  rating: number;
  schedule: number;
  /** امتیاز نهایی (۰ تا ۱) */
  total: number;
}

export interface BidEvaluation {
  id: string;
  partnerName: string;
  totalPriceToman: number;
  capacityKwp: number;
  /** هزینه به ازای هر وات نصبی (تومان/W) */
  pricePerWattToman: number;
  scores: BidScores;
  rank: number;
  /** بهترین ارزش (نه لزوماً ارزان‌ترین) */
  isBestValue: boolean;
  /** اختلافِ قیمت با ارزان‌ترین پیشنهاد (درصد) */
  priceDeltaVsCheapestPercent: number;
  warnings: string[];
}

export interface BidWeights {
  price: number;
  equipment: number;
  warranty: number;
  rating: number;
  schedule: number;
}

export const DEFAULT_BID_WEIGHTS: BidWeights = {
  price: 0.4,
  equipment: 0.2,
  warranty: 0.15,
  rating: 0.15,
  schedule: 0.1,
};

const TIER_SCORE: Record<1 | 2 | 3, number> = { 1: 1, 2: 0.7, 3: 0.4 };

function normalize(value: number, min: number, max: number): number {
  if (max - min < 1e-9) return 1;
  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}

/**
 * مقایسه و رتبه‌بندیِ پیشنهادها.
 * امتیازِ قیمت از نسبتِ «ارزان‌ترین / این پیشنهاد» به‌دست می‌آید تا تفاوتِ
 * عددیِ بزرگِ بازار، امتیازها را له نکند.
 */
export function evaluateBids(
  bids: readonly EpcBidInput[],
  weights: BidWeights = DEFAULT_BID_WEIGHTS,
): BidEvaluation[] {
  if (bids.length === 0) return [];

  const prices = bids.map((bid) => (bid.totalPriceToman / Math.max(0.001, bid.capacityKwp)) / 1000);
  const minPrice = Math.min(...prices);
  const leadTimes = bids.map((bid) => bid.leadTimeDays ?? 180);
  const maxLead = Math.max(...leadTimes);
  const minLead = Math.min(...leadTimes);

  const weightTotal =
    weights.price + weights.equipment + weights.warranty + weights.rating + weights.schedule || 1;

  const scored = bids.map((bid, index) => {
    const pricePerWatt = Math.round((bid.totalPriceToman / Math.max(0.001, bid.capacityKwp)) / 1000);
    const priceScore = minPrice <= 0 ? 1 : Math.min(1, minPrice / Math.max(prices[index] ?? minPrice, 1e-6));
    const equipmentScore = TIER_SCORE[bid.moduleTier ?? 2];
    const warrantyScore =
      0.6 * normalize(bid.productWarrantyYears ?? 10, 0, 15) +
      0.4 * normalize(bid.performanceWarrantyPercent ?? 80, 75, 92);
    const ratingScore = normalize(bid.rating ?? 3, 0, 5);
    const scheduleScore = 1 - normalize(bid.leadTimeDays ?? 180, minLead, maxLead);

    const total =
      (priceScore * weights.price +
        equipmentScore * weights.equipment +
        warrantyScore * weights.warranty +
        ratingScore * weights.rating +
        scheduleScore * weights.schedule) /
      weightTotal;

    const warnings: string[] = [];
    if ((bid.productWarrantyYears ?? 10) < 10) warnings.push("گارانتی محصول کمتر از ۱۰ سال است");
    if ((bid.rating ?? 3) < 3) warnings.push("امتیاز کارفرمایان پایین است");
    if ((bid.leadTimeDays ?? 180) > 240) warnings.push("زمان تحویل طولانی (بیش از ۸ ماه)");
    if ((bid.performanceWarrantyPercent ?? 80) < 80) warnings.push("تضمین عملکردِ ضعیف (کمتر از ۸۰٪ در سال ۲۵)");

    return {
      bid: { ...bid, id: bid.id ?? `bid-${index + 1}` },
      pricePerWatt,
      scores: {
        price: Math.round(priceScore * 1000) / 1000,
        equipment: Math.round(equipmentScore * 1000) / 1000,
        warranty: Math.round(warrantyScore * 1000) / 1000,
        rating: Math.round(ratingScore * 1000) / 1000,
        schedule: Math.round(scheduleScore * 1000) / 1000,
        total: Math.round(total * 1000) / 1000,
      },
      warnings,
    };
  });

  const ranked = scored.sort((a, b) => b.scores.total - a.scores.total);

  return ranked.map((entry, index) => ({
    id: entry.bid.id ?? `bid-${index + 1}`,
    partnerName: entry.bid.partnerName,
    totalPriceToman: entry.bid.totalPriceToman,
    capacityKwp: entry.bid.capacityKwp,
    pricePerWattToman: entry.pricePerWatt,
    scores: entry.scores,
    rank: index + 1,
    isBestValue: index === 0,
    priceDeltaVsCheapestPercent:
      minPrice > 0 ? Math.round(((entry.pricePerWatt * 1000 - minPrice * 1000) / (minPrice * 1000)) * 1000) / 10 : 0,
    warnings: entry.warnings,
  }));
}

/** پوشاندنِ اطلاعات تماس برای نمایش به پیمانکاران (تا پیش از انتخاب) */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/gu, "");
  if (digits.length < 4) return "•••";
  return `${digits.slice(0, 4)}•••${digits.slice(-2)}`;
}

export interface EpcLeadSummary {
  requestId: string;
  province: string;
  capacityKwp: number;
  /** نوعِ نصب: پشت‌بامی/زمینی/سایبان */
  mounting: "roof" | "ground" | "carport";
  annualConsumptionKwh: number;
  annualProductionKwh: number;
  preferredSchedule: "asap" | "quarter" | "half-year";
  bidCount: number;
  /** اطلاعات تماسِ پوشانده‌شده */
  contactMasked: { name: string; phone: string };
  createdAtIso: string;
}

/** خلاصه‌ی ناشناسِ یک درخواست برای فهرستِ پیمانکاران */
export function summarizeLead(lead: {
  requestId: string;
  province: string;
  capacityKwp: number;
  mounting?: "roof" | "ground" | "carport";
  annualConsumptionKwh: number;
  annualProductionKwh: number;
  preferredSchedule?: "asap" | "quarter" | "half-year";
  bidCount?: number;
  contactName: string;
  contactPhone: string;
  createdAt?: Date;
}): EpcLeadSummary {
  const nameParts = lead.contactName.trim().split(/\s+/u);
  const maskedName =
    nameParts.length > 1 ? `${nameParts[0]} ${"•".repeat(Math.max(2, (nameParts[1] ?? "").length))}` : "مشتری ناشناس";

  return {
    requestId: lead.requestId,
    province: lead.province,
    capacityKwp: Math.round(lead.capacityKwp * 10) / 10,
    mounting: lead.mounting ?? "roof",
    annualConsumptionKwh: Math.round(lead.annualConsumptionKwh),
    annualProductionKwh: Math.round(lead.annualProductionKwh),
    preferredSchedule: lead.preferredSchedule ?? "quarter",
    bidCount: lead.bidCount ?? 0,
    contactMasked: { name: maskedName, phone: maskPhone(lead.contactPhone) },
    createdAtIso: (lead.createdAt ?? new Date()).toISOString(),
  };
}
