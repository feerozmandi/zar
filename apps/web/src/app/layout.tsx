import type { Metadata, Viewport } from "next";
import { XENNIC_BRAND } from "@xennic/design-tokens";
import { vazirmatn } from "@/lib/fonts";
import { siteUrl } from "@/lib/env";
import { Providers } from "@/providers/providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${XENNIC_BRAND.name} | ${XENNIC_BRAND.tagline}`,
    template: `%s | ${XENNIC_BRAND.name}`,
  },
  description:
    "پلتفرم جامع Xennic (محصول شرکت زر نور نیرو یکتا)؛ ممیزی خودکار قبوض صنعتی، امکان‌سنجی نیروگاه خورشیدی، جعبه‌ابزار محاسبات مهندسی برق و دانشنامه قوانین انرژی.",
  applicationName: XENNIC_BRAND.name,
  manifest: "/site.webmanifest",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    siteName: XENNIC_BRAND.name,
    url: siteUrl,
    title: `${XENNIC_BRAND.name} — ${XENNIC_BRAND.tagline}`,
    description: "بستر تخصصی ممیزی خودکار قبوض، امکان‌سنجی خورشیدی و محاسبات مهندسی برق با هوش مصنوعی.",
  },
  twitter: { card: "summary_large_image", title: XENNIC_BRAND.name },
  robots: { index: true, follow: true },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#061D24" }],
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark light",
};

/** ریشه‌ی چیدمان: راست‌به‌چپ، تم تیره پیش‌فرض و ارائه‌دهنده‌های مشترک */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable} suppressHydrationWarning>
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
