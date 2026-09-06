import { routes } from "@xennic/design-tokens";
import { ArrowLeft, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@xennic/ui";

/** هیرو لندینگ — تیتر، زیرتیتر و دو CTA مطابق نوت ۴ §۲ */
export function Hero() {
  return (
    <section className="xennic-grid-lines relative overflow-hidden border-b border-border/60">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-20 lg:grid-cols-[1.15fr_1fr] lg:px-8 lg:py-28">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground">
            <Zap className="size-3.5 text-primary" />
            موتور تحلیل اسناد انرژی با هوش مصنوعی
          </p>
          <h1 className="text-3xl leading-tight font-black sm:text-4xl lg:text-5xl lg:leading-[1.2]">
            مهندسی، نوآوری برای آینده انرژی با قدرت هوش مصنوعی
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground">
            پلتفرم جامع <strong className="text-foreground">Xennic</strong> (محصول شرکت زر نور نیرو یکتا)؛
            بستر تخصصی ممیزی خودکار قبوض صنعتی، امکان‌سنجی نیروگاه خورشیدی، جعبه‌ابزار محاسبات مهندسی برق و
            دانشنامه قوانین انرژی.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="action">
              <Link href={routes.audit}>
                تحلیل آنلاین قبض برق (رایگان)
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={routes.solar}>محاسبه‌گر نیروگاه خورشیدی</Link>
            </Button>
          </div>
        </div>

        <aside className="xennic-glass rounded-(--radius-card) p-6" aria-label="مراحل کار پلتفرم">
          <ol className="space-y-4 text-sm">
            {[
              "آپلود تصویر یا PDF قبض برق",
              "استخراج داده‌ها با موتور OCR",
              "تحلیل خطای تعرفه‌ای، دیماند و راکتیو",
              "صدور توصیه‌نامه مدیریتی و گزارش PDF",
            ].map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                  {index + 1}
                </span>
                <span className="pt-1 leading-6">{step}</span>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </section>
  );
}
