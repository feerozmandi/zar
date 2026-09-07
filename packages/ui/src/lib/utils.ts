import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** تنها ابزار ترکیب کلاس‌ها در کل مونورپو (الگوی shadcn/ui) */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
