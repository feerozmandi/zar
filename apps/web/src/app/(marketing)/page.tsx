import { XENNIC_BRAND } from "@xennic/design-tokens";
import { siteUrl } from "@/lib/env";
import { Faq } from "../_components/marketing/faq";
import { FinalCta } from "../_components/marketing/final-cta";
import { Hero } from "../_components/marketing/hero";
import { Process } from "../_components/marketing/process";
import { Services } from "../_components/marketing/services";
import { Solutions } from "../_components/marketing/solutions";
import { Stats } from "../_components/marketing/stats";
import { TrustBar } from "../_components/marketing/trust-bar";
import { WhyUs } from "../_components/marketing/why-us";

/** داده‌ی ساخت‌یافته سازمان و وب‌سایت برای نتایج غنی گوگل */
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: XENNIC_BRAND.legalName,
  alternateName: XENNIC_BRAND.legalNameLatin,
  brand: { "@type": "Brand", name: XENNIC_BRAND.name },
  url: siteUrl,
  logo: `${siteUrl}/icon.svg`,
  slogan: XENNIC_BRAND.tagline,
  description:
    "مشاور، طراح و مجری خدمات مهندسی برق و انرژی‌های نو؛ ممیزی هوشمند قبض، امکان‌سنجی نیروگاه خورشیدی و جعبه‌ابزار محاسبات مهندسی برق.",
  knowsAbout: ["مهندسی برق", "انرژی‌های نو", "نیروگاه خورشیدی", "ممیزی انرژی", "پست‌های فشار قوی"],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: XENNIC_BRAND.name,
  alternateName: XENNIC_BRAND.legalName,
  url: siteUrl,
  inLanguage: "fa-IR",
  publisher: { "@type": "Organization", name: XENNIC_BRAND.legalName },
};

/** لندینگ پیج اصلی Xennic — بازطراحی مدرن ۱۴۰۴ با ساختار نوت ۴ */
export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <Hero />
      <TrustBar />
      <Services />
      <Solutions />
      <Stats />
      <WhyUs />
      <Process />
      <Faq />
      <FinalCta />
    </>
  );
}
