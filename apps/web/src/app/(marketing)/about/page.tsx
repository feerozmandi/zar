import type { Metadata } from "next";
import { XENNIC_BRAND } from "@xennic/design-tokens";
import { Stats } from "../../_components/marketing/stats";

export const metadata: Metadata = {
  title: "درباره شرکت زر نور نیرو یکتا",
  description:
    "پشتوانه فنی و تجربی پلتفرم Xennic؛ تلفیق دانش مهندسی برق با هوش مصنوعی، با بیش از ۳۰ سال تجربه در شبکه توزیع، صنایع و انرژی‌های نو.",
};

/** «درباره ما» — بخش اعتبار تجاری نوت ۴ §۴ */
export default function AboutPage() {
  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-16 lg:px-8">
      <h1 className="text-3xl font-black">پشتوانه فنی و تجربی</h1>
      <p className="mt-5 text-lg leading-9 text-muted-foreground">
        {XENNIC_BRAND.legalName} ({XENNIC_BRAND.legalNameLatin}) با تلفیق دانش مهندسی برق و هوش مصنوعی، پلتفرم{" "}
        {XENNIC_BRAND.name} را به‌عنوان بستر تخصصی ممیزی انرژی، امکان‌سنجی خورشیدی و محاسبات مهندسی توسعه
        می‌دهد.
      </p>
      <div className="mt-10">
        <Stats />
      </div>
    </section>
  );
}
