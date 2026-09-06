import dayjs from "dayjs";
import { toJalaali as gregorianToJalaali } from "jalaali-js";

const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"] as const;

/** تبدیل ارقام لاتین به فارسی برای خروجی‌های متنی و PDF */
export function toPersianDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => FA_DIGITS[Number(d)] ?? d);
}

export function toLatinDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

/** قالب‌گذاری هزارگان با جداکننده‌ی فارسی */
export function formatNumber(value: number, fractionDigits = 0): string {
  return new Intl.NumberFormat("fa-IR", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

export function formatToman(value: number): string {
  return `${formatNumber(Math.round(value))} تومان`;
}

export function formatKwh(value: number): string {
  return `${formatNumber(value, value % 1 === 0 ? 0 : 1)} کیلووات‌ساعت`;
}

/** تاریخ شمسی (برای درج در دفترچه محاسبات و گزارش ممیزی) */
export function toJalali(date: Date = new Date()): { jy: number; jm: number; jd: number } {
  return gregorianToJalaali(date);
}

export function formatJalaliDate(date: Date = new Date()): string {
  const { jy, jm, jd } = toJalali(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return toPersianDigits(`${jy}/${pad(jm)}/${pad(jd)}`);
}

export function formatJalaliDateTime(date: Date = new Date()): string {
  return `${formatJalaliDate(date)} — ${toPersianDigits(dayjs(date).format("HH:mm"))}`;
}

/** نام کامل یک ماه شمسی — برای سربرگ گزارش‌ها */
export const JALALI_MONTHS = [
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

export function jalaliMonthName(month: number): string {
  return JALALI_MONTHS[month - 1] ?? "";
}
