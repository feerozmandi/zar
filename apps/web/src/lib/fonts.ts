import localFont from "next/font/local";

/**
 * فونت سازمانی وزیرمتن — از پکیج npm `vazirmatn` (منبع self-hosted، بدون وابستگی به CDN).
 * نام متغیر باید با `--xennic-font-sans` در @xennic/design-tokens هم‌خوان باشد.
 */
export const vazirmatn = localFont({
  src: [
    {
      path: "../../node_modules/vazirmatn/fonts/webfonts/Vazirmatn-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../node_modules/vazirmatn/fonts/webfonts/Vazirmatn-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../node_modules/vazirmatn/fonts/webfonts/Vazirmatn-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../node_modules/vazirmatn/fonts/webfonts/Vazirmatn-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--xennic-font-sans",
  display: "swap",
  adjustFontFallback: false,
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});
