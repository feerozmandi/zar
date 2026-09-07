/** نام ماه‌های شمسی (ترتیب آرایه‌های ماهانه در کل ماژول از فروردین است) */
export const MONTH_LABELS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
] as const;

export const MONTH_LABELS_SHORT = [
  "فر",
  "ارد",
  "خرد",
  "تیر",
  "مر",
  "شهر",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسف",
] as const;

/** مبلغ‌های بزرگ به «میلیارد/میلیون تومان» — خواناتر از عددِ خام در جدول سناریوها */
export function compactToman(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "−" : "";
  const fa = (input: number, digits = 1): string =>
    new Intl.NumberFormat("fa-IR", { maximumFractionDigits: digits }).format(input);
  if (abs >= 1_000_000_000_000) return `${sign}${fa(abs / 1_000_000_000_000)} همت`;
  if (abs >= 1_000_000_000) return `${sign}${fa(abs / 1_000_000_000)} میلیارد تومان`;
  if (abs >= 1_000_000) return `${sign}${fa(abs / 1_000_000)} میلیون تومان`;
  if (abs >= 1_000) return `${sign}${fa(abs / 1_000)} هزار تومان`;
  return `${sign}${fa(abs)} تومان`;
}

export function compactNumber(value: number, digits = 0): string {
  return new Intl.NumberFormat("fa-IR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

/** درصد با ارقام فارسی */
export function percent(value: number, digits = 0): string {
  return `${compactNumber(value * 100, digits)}٪`;
}

export function years(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  return `${compactNumber(value, 1)} سال`;
}
