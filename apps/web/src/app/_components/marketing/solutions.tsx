import { modules, routes } from "@xennic/design-tokens";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

const descriptions: Record<string, string> = {
  audit: "آپلود قبض، استخراج خودکار داده با OCR و کشف خطاهای تعرفه‌ای، جریمه دیماند و راکتیو.",
  solar: "ارزیابی پتانسیل تابش سقف، برآورد هزینه احداث و بازگشت سرمایه بر اساس مصوبات ماده ۱۲ و ۱۶.",
  engineering: "محاسبه آنلاین افت ولتاژ، سایزینگ کابل، بانک خازنی و ژنراتور مطابق IEC با خروجی PDF.",
  wiki: "جستجوی هوشمند در مبحث ۱۳ مقررات ملی، نشریه ۱۱۰ و آیین‌نامه‌های توانیر.",
};

const ctas: Record<string, string> = {
  audit: "ورود به پنل ممیزی",
  solar: "محاسبه طرح توجیهی",
  engineering: "استفاده از ابزارهای مهندسی",
  wiki: "ورود به دانشنامه",
};

const images: Record<string, { src: string; alt: string }> = {
  audit: {
    src: "/images/electrical-panel.jpg",
    alt: "تست تابلوی برق صنعتی با مولتی‌متر — ممیزی هوشمند انرژی",
  },
  solar: {
    src: "/images/rooftop-solar.jpg",
    alt: "نمای هوایی نیروگاه خورشیدی سقفی روی ساختمان صنعتی",
  },
  engineering: {
    src: "/images/engineering-team.jpg",
    alt: "مهندسان برق در حال بازبینی نقشه تک‌خطی در پست فشار قوی",
  },
  wiki: {
    src: "/images/grid-transmission.jpg",
    alt: "دکل‌های انتقال برق فشار قوی در گرگ‌ومیش — شبکه سراسری برق",
  },
};

const badges: Record<string, { label: string; className: string } | undefined> = {
  audit: { label: "رایگان شروع کنید", className: "bg-destructive/90 text-white" },
  wiki: { label: "در حال توسعه", className: "bg-secondary/90 text-secondary-foreground" },
};

/** ابزارهای هوشمند پلتفرم — کارت‌های تصویری ماژول‌ها (بازطراحی Interactive Workspaces نوت ۴ §۳) */
export function Solutions() {
  return (
    <section id="platform" className="border-y border-border/60 bg-card/20">
      <div className="mx-auto w-full max-w-7xl px-4 py-20 lg:px-8 lg:py-28">
        <SectionHeading
          kicker="ابزارهای هوشمند"
          title="پلتفرم Xennic؛ ابزارهایی که کار مهندسان را ساده می‌کنند"
          description="چهار ماژول ابری و یکپارچه که به‌عنوان پشتوانه‌ی خدمات مهندسی شرکت توسعه یافته‌اند و همین امروز رایگان در دسترس شما هستند."
        />

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:mt-16 lg:gap-8">
          {modules.map((module, index) => {
            const image = images[module.key] ?? { src: "/images/grid-transmission.jpg", alt: module.title };
            const badge = badges[module.key];
            return (
              <Reveal key={module.key} delay={(index % 2) * 110}>
                <Link
                  href={module.route}
                  className="group block overflow-hidden rounded-(--radius-card) border border-border/60 bg-card/60 backdrop-blur-sm transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10"
                >
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      sizes="(min-width: 1024px) 600px, (min-width: 768px) 50vw, 100vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                    />
                    <div
                      aria-hidden
                      className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent"
                    />
                    {badge && (
                      <span
                        className={`absolute top-4 left-4 rounded-full px-3 py-1 text-[11px] font-bold backdrop-blur-sm ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    )}
                  </div>

                  <div className="relative -mt-2 p-6 lg:p-7">
                    <span
                      aria-hidden
                      className="mb-4 inline-block h-1 w-10 rounded-full"
                      style={{ backgroundColor: module.accent }}
                    />
                    <h3 className="text-xl font-black">{module.title}</h3>
                    <p className="mt-2.5 text-sm leading-7 text-muted-foreground">
                      {descriptions[module.key]}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                      {ctas[module.key]}
                      <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-1.5" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={120}>
          <p className="mt-10 text-center text-sm text-muted-foreground">
            دنبال مقایسه‌ی مدل‌های هوش مصنوعی هستید؟{" "}
            <Link href={routes.ai} className="font-semibold text-primary underline-offset-4 hover:underline">
              صفحه‌ی موتور AI پلتفرم را ببینید
            </Link>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
