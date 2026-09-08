import { routes, XENNIC_BRAND } from "@xennic/design-tokens";
import { ArrowLeft, Cpu, FileCheck2, Sparkles, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@xennic/ui";
import { Reveal } from "./reveal";

const points = [
  {
    icon: Cpu,
    title: "تلفیق تجربه‌ی مهندسی با هوش مصنوعی",
    description: "دانش سه دهه شبکه و صنعت، در قالب موتورهای تحلیلی هوشمند و ابزارهای محاسباتی ابری.",
  },
  {
    icon: FileCheck2,
    title: "خروجی‌های قابل استناد",
    description: "گزارش‌ها و دفترچه محاسبات مطابق IEC، نشریه ۱۱۰ و مبحث ۱۳؛ آماده ارائه به ناظر و سازمان.",
  },
  {
    icon: Users,
    title: "تیم یکپارچه‌ی مشاور، طراح و مجری",
    description: "یک تیم واحد از مطالعه و طراحی تا اجرا و نگهداشت؛ بدون واسطه و بدون افت کیفیت.",
  },
  {
    icon: Sparkles,
    title: "مسیر رایگان تا سازمانی",
    description: "از ابزارهای رایگان جذب و تحلیل تا قراردادهای مشاوره، EPC و API اختصاصی سازمان‌ها.",
  },
];

/** معرفی شرکت — پشتوانه‌ی فنی و تجربی زر نور نیرو یکتا (نوت ۴ §۴) */
export function WhyUs() {
  return (
    <section id="why-us" className="mx-auto w-full max-w-7xl px-4 py-20 lg:px-8 lg:py-28">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* تصویر + کارت شناور تجربه */}
        <Reveal className="relative order-2 lg:order-1">
          <div className="relative aspect-[4/3] overflow-hidden rounded-(--radius-card) border border-border/60">
            <Image
              src="/images/wind-renewable.jpg"
              alt="مزرعه ترکیبی انرژی تجدیدپذیر؛ توربین‌های بادی و پنل‌های خورشیدی در طلوع آفتاب"
              fill
              sizes="(min-width: 1024px) 550px, 100vw"
              className="object-cover"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent"
            />
          </div>
          <div className="xennic-glass absolute -bottom-6 left-4 rounded-2xl px-6 py-4 sm:left-8">
            <p className="xennic-numeric text-3xl font-black text-primary" dir="ltr">
              +۳۰
            </p>
            <p className="mt-1 text-xs text-muted-foreground">سال تجربه‌ی ارشد مهندسی برق</p>
          </div>
        </Reveal>

        {/* متن و ویژگی‌ها */}
        <div className="order-1 lg:order-2">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary">
              <span aria-hidden className="size-1.5 rounded-full bg-primary" />
              چرا {XENNIC_BRAND.legalName}؟
            </span>
          </Reveal>
          <Reveal delay={90}>
            <h2 className="mt-5 text-2xl leading-[1.4] font-black sm:text-3xl lg:text-4xl">
              پشتوانه‌ی فنی؛ تلفیق دانش مهندسی برق با هوش مصنوعی
            </h2>
          </Reveal>
          <Reveal delay={150}>
            <p className="mt-5 leading-8 text-muted-foreground">
              {XENNIC_BRAND.legalName} با بهره‌گیری از بیش از ۳۰ سال تجربه‌ی ارشد مهندسی در شبکه‌ی توزیع،
              صنایع، ساختمان و سیستم‌های انرژی‌های نو، خدمات مشاوره، طراحی و اجرای تخصصی ارائه می‌کند و پلتفرم
              Xennic را به‌عنوان بازوی هوشمند این خدمات توسعه می‌دهد.
            </p>
          </Reveal>

          <ul className="mt-8 space-y-6">
            {points.map((point, index) => (
              <Reveal as="li" key={point.title} delay={200 + index * 80} className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <point.icon className="size-5" aria-hidden />
                </span>
                <div>
                  <h3 className="font-bold">{point.title}</h3>
                  <p className="mt-1 text-sm leading-7 text-muted-foreground">{point.description}</p>
                </div>
              </Reveal>
            ))}
          </ul>

          <Reveal delay={520}>
            <Button asChild variant="outline" size="lg" className="mt-9">
              <Link href={routes.about}>
                بیشتر درباره‌ی ما
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
