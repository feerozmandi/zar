import type { Metadata, Viewport } from "next";
import { XENNIC_BRAND } from "@xennic/design-tokens";
import { vazirmatn } from "@/lib/fonts";
import { siteUrl } from "@/lib/env";
import { Providers } from "@/providers/providers";
import { AuthBootstrap } from "@/providers/auth-bootstrap";
import { WorkspaceSplash } from "@/app/_components/layout/workspace-splash";
import { EnergyField } from "@/app/_components/layout/energy-field";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${XENNIC_BRAND.name} | ${XENNIC_BRAND.tagline}`,
    template: `%s | ${XENNIC_BRAND.name}`,
  },
  description:
    "زر نور نیرو یکتا؛ مشاور، طراح و مجری خدمات مهندسی برق و انرژی‌های نو و خالق پلتفرم Xennic — ممیزی خودکار قبوض صنعتی، امکان‌سنجی نیروگاه خورشیدی، جعبه‌ابزار محاسبات مهندسی برق و دانشنامه قوانین انرژی.",
  keywords: [
    "مهندسی برق",
    "انرژی‌های نو",
    "نیروگاه خورشیدی",
    "امکان‌سنجی خورشیدی",
    "ممیزی انرژی",
    "تحلیل قبض برق",
    "طراحی و اجرای برق صنعتی",
    "EPC برق",
    "زر نور نیرو یکتا",
    "Xennic",
    "محاسبات مهندسی برق",
    "افت ولتاژ",
    "سایزینگ کابل",
    "ماده ۱۲ بورس انرژی",
  ],
  applicationName: XENNIC_BRAND.name,
  manifest: "/site.webmanifest",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    siteName: XENNIC_BRAND.name,
    url: siteUrl,
    title: `${XENNIC_BRAND.name} — ${XENNIC_BRAND.tagline}`,
    description:
      "مشاور، طراح و مجری خدمات مهندسی برق و انرژی‌های نو؛ ممیزی هوشمند قبض، امکان‌سنجی نیروگاه خورشیدی و جعبه‌ابزار محاسبات مهندسی با هوش مصنوعی.",
    images: [
      {
        url: "/images/hero-solar-plant.jpg",
        width: 1280,
        height: 800,
        alt: "نیروگاه خورشیدی زر نور نیرو یکتا",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: XENNIC_BRAND.name,
    description: "مشاور، طراح و مجری خدمات مهندسی برق و انرژی‌های نو — پلتفرم Xennic",
    images: ["/images/hero-solar-plant.jpg"],
  },
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
        <Providers>
          <AuthBootstrap />
          {/* پس‌زمینه‌ی WebGL «میدان انرژی» + گرید بلوپرینت پشت محتوا */}
          <EnergyField />
          {children}
          {/* خوش‌آمدگویی لاگین‌شده — فقط صفحه‌ی نخست */}
          <WorkspaceSplash />
        </Providers>
      </body>
    </html>
  );
}
