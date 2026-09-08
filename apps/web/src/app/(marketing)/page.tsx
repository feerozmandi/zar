import { siteUrl } from "@/lib/env";
import { company } from "@/lib/marketing-content";
import { landingStructuredData, marketingMetadata, serializeJsonLd } from "@/lib/marketing-seo";
import { CompanyIntro } from "../_components/marketing/company-intro";
import { ContactCta } from "../_components/marketing/contact-cta";
import { Faq } from "../_components/marketing/faq";
import { Hero } from "../_components/marketing/hero";
import { ModuleCards } from "../_components/marketing/module-cards";
import { ExpertiseStrip, Services } from "../_components/marketing/services";

export const metadata = marketingMetadata("/", company.title, company.description);

/** شرکت در مرکز روایت؛ ابزارهای دیجیتال مکمل خدمات و مسیر جذب کاربر هستند. */
export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(landingStructuredData(siteUrl)) }}
      />
      <Hero />
      <ExpertiseStrip />
      <Services />
      <CompanyIntro />
      <ModuleCards />
      <Faq />
      <ContactCta />
    </>
  );
}
