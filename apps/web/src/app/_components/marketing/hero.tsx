import { routes } from "@xennic/design-tokens";
import { ArrowLeft, BadgeCheck, Calculator, Sun } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@xennic/ui";
import { Reveal } from "./reveal";

const trustChips = [
  { icon: BadgeCheck, label: "مطابق استانداردهای IEC و نشریه ۱۱۰" },
  { icon: Sun, label: "مصوبات ماده ۱۲ و ۱۶ بورس انرژی" },
  { icon: Calculator, label: "ابزارهای تخصصی رایگان برای مهندسان" },
];

/**
 * هیرو تمام‌عرض لندینگ — نمای سینمایی نیروگاه خورشیدی با لایه‌های گرادیانی
 * هم‌رنگ پس‌زمینه، بج «مشاور، طراح، مجری»، H1 برند و دو CTA تبدیل.
 */
export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      {/* پس‌زمینه‌ی تصویری + لایه‌های محو هم‌رنگ تم */}
      <div className="absolute inset-0 -z-10" aria-hidden>
        <Image
          src="/images/hero-solar-plant.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[70%_center] md:object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/60 to-background" />
        <div className="absolute inset-0 hidden bg-gradient-to-l from-background via-background/55 to-background/10 md:block" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-col px-4 pt-32 pb-16 sm:pt-36 lg:px-8 lg:pt-44 lg:pb-24">
        <Reveal>
          <p className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-md">
            <span aria-hidden className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            مشاور، طراح و مجری خدمات مهندسی برق و انرژی‌های نو
          </p>
        </Reveal>

        <Reveal delay={100}>
          <h1 className="mt-6 max-w-3xl text-[2rem] leading-[1.35] font-black sm:text-4xl sm:leading-[1.35] lg:text-[3.25rem] lg:leading-[1.3]">
            مهندسی، نوآوری برای <span className="energy-text">آینده‌ی انرژی</span> با قدرت هوش مصنوعی
          </h1>
        </Reveal>

        <Reveal delay={180}>
          <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg sm:leading-9">
            <strong className="font-bold text-foreground">زر نور نیرو یکتا</strong> با بیش از سه دهه تجربه‌ی
            مهندسی برق، بستر هوشمند <strong className="font-bold text-foreground">Xennic</strong> را ارائه
            می‌کند؛ از ممیزی خودکار قبوض صنعتی و امکان‌سنجی نیروگاه خورشیدی تا جعبه‌ابزار محاسبات مهندسی و
            دانشنامه‌ی قوانین انرژی.
          </p>
        </Reveal>

        <Reveal delay={260}>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" variant="action" className="shadow-lg shadow-destructive/25">
              <Link href={routes.audit}>
                تحلیل آنلاین قبض برق (رایگان)
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-border/80 bg-card/40 backdrop-blur-sm hover:bg-card/70"
            >
              <Link href={routes.solar}>محاسبه‌گر نیروگاه خورشیدی</Link>
            </Button>
          </div>
        </Reveal>

        <Reveal delay={340}>
          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
            {trustChips.map((chip) => (
              <li key={chip.label} className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <chip.icon className="size-4 text-primary" aria-hidden />
                {chip.label}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
