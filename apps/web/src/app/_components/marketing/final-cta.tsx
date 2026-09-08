import { routes } from "@xennic/design-tokens";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@xennic/ui";
import { Reveal } from "./reveal";

/** فراخوان پایانی — تبدیل کاربر به سرنخ با پس‌زمینه‌ی سینمایی پنل خورشیدی در گرگ‌ومیش */
export function FinalCta() {
  return (
    <section id="cta" className="mx-auto w-full max-w-7xl px-4 pb-24 lg:px-8">
      <Reveal>
        <div className="relative isolate overflow-hidden rounded-[1.75rem] border border-border/60">
          {/* پس‌زمینه */}
          <div className="absolute inset-0 -z-10" aria-hidden>
            <Image
              src="/images/cta-solar-dusk.jpg"
              alt=""
              fill
              sizes="(min-width: 1280px) 1200px, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-background/75" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/60" />
          </div>

          <div className="flex flex-col items-center px-6 py-16 text-center sm:px-12 lg:py-24">
            <h2 className="max-w-2xl text-2xl leading-[1.45] font-black sm:text-3xl lg:text-4xl lg:leading-[1.4]">
              آماده‌اید تصویر دقیقی از انرژی خود داشته باشید؟
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-8 text-muted-foreground sm:text-base">
              همین حالا با ابزارهای رایگان شروع کنید یا یک جلسه‌ی مشاوره‌ی فنی با کارشناسان ما رزرو کنید؛ از
              تحلیل قبض تا اجرای کامل نیروگاه خورشیدی.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" variant="action" className="shadow-lg shadow-destructive/25">
                <Link href={routes.contact}>
                  درخواست مشاوره‌ی رایگان
                  <ArrowLeft className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-border/80 bg-card/40 backdrop-blur-sm hover:bg-card/70"
              >
                <Link href={routes.audit}>تحلیل قبض برق</Link>
              </Button>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
