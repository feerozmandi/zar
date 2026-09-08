import type { Metadata } from "next";
import { company, faqs, services } from "./marketing-content";

export function marketingMetadata(path: string, title: string, description: string): Metadata {
  const image = {
    url: "/images/landing/og-cover.jpg",
    width: 1200,
    height: 630,
    alt: "زر نور نیرو یکتا — مهندسی برق و انرژی‌های نو",
  };

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "fa_IR",
      siteName: `${company.name} | ${company.brand}`,
      url: path,
      title,
      description,
      images: [image],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

/** ادعا، نشانی تماس یا آمار تأییدنشده به داده‌های ساختاریافته اضافه نمی‌شود. */
export function landingStructuredData(siteUrl: string) {
  const url = new URL("/", siteUrl).href;
  const organizationId = `${url}#organization`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: company.name,
        legalName: company.name,
        alternateName: [company.brand, company.latinName],
        url,
        logo: new URL("/icon.svg", url).href,
        description: company.description,
        knowsAbout: ["مهندسی برق", "نیروگاه خورشیدی", "شبکه توزیع برق", "مدیریت انرژی"],
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "خدمات مهندسی برق و انرژی‌های نو",
          itemListElement: services.map((service) => ({
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              "@id": `${url}#service-${service.id}`,
              name: service.title,
              description: service.description,
              provider: { "@id": organizationId },
              url: new URL(service.href, url).href,
            },
          })),
        },
      },
      {
        "@type": "WebSite",
        "@id": `${url}#website`,
        url,
        name: `${company.name} | ${company.brand}`,
        inLanguage: "fa-IR",
        publisher: { "@id": organizationId },
      },
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: company.title,
        description: company.description,
        inLanguage: "fa-IR",
        isPartOf: { "@id": `${url}#website` },
        about: { "@id": organizationId },
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        inLanguage: "fa-IR",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      },
    ],
  };
}

/** مانع بسته‌شدن تگ script در صورت تغییر آتی محتوای ورودی می‌شود. */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
