import localFont from "next/font/local";

/** یک فونت متغیر self-hosted به‌جای دانلود چهار وزن جداگانه؛ بدون درخواست CDN. */
export const vazirmatn = localFont({
  src: "../assets/fonts/vazirmatn-variable.woff2",
  weight: "100 900",
  style: "normal",
  variable: "--xennic-font-sans",
  display: "optional",
  adjustFontFallback: "Arial",
  fallback: ["Tahoma", "Arial", "sans-serif"],
});
