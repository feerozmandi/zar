import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { company, faqs, filterTools, marketingTools, services } from "./marketing-content";
import { landingStructuredData, marketingMetadata, serializeJsonLd } from "./marketing-seo";

vi.mock("@/lib/env", () => ({ siteUrl: "https://example.com/" }));
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";

describe("محتوای عمومی و وضعیت ابزارها", () => {
  it("خدمات شرکت را پیش از معرفی ابزارها، با مسیر واقعی مشاوره تعریف می‌کند", () => {
    expect(services).toHaveLength(3);
    for (const service of services) {
      expect(service.href).toMatch(/^\/contact\?topic=(solar|engineering)$/);
      expect(service.image).toMatch(/^\/images\/landing\/.+\.webp$/);
    }
  });

  it("ابزارهای آماده و آزمایشی را از قابلیت‌های در حال توسعه جدا می‌کند", () => {
    expect(filterTools("all")).toHaveLength(4);
    expect(filterTools("available").map((tool) => tool.id)).toEqual(["audit", "solar", "engineering"]);
    expect(filterTools("development").map((tool) => tool.id)).toEqual(["wiki"]);
    expect(marketingTools.find((tool) => tool.id === "engineering")?.href).toBe("/engineering/voltage-drop");
  });
});

describe("متادیتا و داده ساختاریافته لندینگ", () => {
  it("canonical و تصویر اشتراک‌گذاری مستقل برای هر صفحه دارد", () => {
    for (const path of ["/", "/about", "/contact"]) {
      const metadata = marketingMetadata(path, company.title, company.description);
      expect(metadata.alternates?.canonical).toBe(path);
      expect(metadata.openGraph).toMatchObject({
        url: path,
        locale: "fa_IR",
        images: [{ url: "/images/landing/og-cover.jpg", width: 1200, height: 630 }],
      });
      expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
    }
  });

  it("پرسش و پاسخ schema دقیقاً از محتوای قابل مشاهده ساخته می‌شود", () => {
    const graph = landingStructuredData("https://example.com/")["@graph"];
    const faq = graph.find((node) => node["@type"] === "FAQPage");
    expect(faq?.mainEntity).toEqual(
      faqs.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    );
  });

  it("نشانی‌های schema مطلق و بدون تکرار اسلش هستند", () => {
    const schema = landingStructuredData("https://example.com/");
    const organization = schema["@graph"].find((node) => node["@type"] === "Organization");
    expect(organization).toMatchObject({
      name: company.name,
      url: "https://example.com/",
      logo: "https://example.com/icon.svg",
    });
    expect(organization?.hasOfferCatalog?.itemListElement).toHaveLength(3);
    expect(JSON.stringify(schema)).not.toContain("example.com//");
    expect(organization).not.toHaveProperty("telephone");
  });

  it("رشته مخرب نمی‌تواند تگ JSON-LD را ببندد", () => {
    const value = { name: "</script><script>alert('x')</script>" };
    const serialized = serializeJsonLd(value);
    expect(serialized).not.toContain("<");
    expect(JSON.parse(serialized)).toEqual(value);
  });

  it("نقشه سایت فقط صفحات عمومی قابل ایندکس را فهرست می‌کند", () => {
    expect(sitemap().map((entry) => entry.url)).toEqual([
      "https://example.com/",
      "https://example.com/about",
      "https://example.com/contact",
    ]);
  });

  it("robots مسیرهای شخصی و احراز هویت را پوشش می‌دهد", () => {
    const result = robots();
    expect(result.sitemap).toBe("https://example.com/sitemap.xml");
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    for (const path of ["/audit", "/solar", "/engineering", "/admin", "/ai", "/login", "/register"]) {
      expect(rules[0]?.disallow).toContain(path);
    }
  });
});

describe("دارایی‌های آماده انتشار", () => {
  it("تمام اندازه‌های AVIF و WebP تصاویر لندینگ در مخزن وجود دارند", () => {
    for (const service of services) {
      const stem = service.image.replace(/\.webp$/, "");
      for (const width of [480, 800, 1264]) {
        expect(existsSync(path.join(process.cwd(), "public", `${stem}-${width}.avif`))).toBe(true);
      }
      for (const width of [480, 800]) {
        expect(existsSync(path.join(process.cwd(), "public", `${stem}-${width}.webp`))).toBe(true);
      }
    }
  });
  it("تصویر اشتراک‌گذاری و فونت محلی همراه مجوز موجودند", () => {
    for (const file of [
      "public/images/landing/og-cover.jpg",
      "src/assets/fonts/vazirmatn-variable.woff2",
      "src/assets/fonts/OFL.txt",
    ]) {
      expect(existsSync(path.join(process.cwd(), file))).toBe(true);
    }
  });
});
