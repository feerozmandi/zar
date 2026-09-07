import { modules } from "@xennic/design-tokens";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardTitle } from "@xennic/ui";

const descriptions: Record<string, string> = {
  audit: "کشف خطاهای تعرفه‌ای، محاسبه جریمه‌های دیماند و راکتیو، و صدور راهکار کاهش هزینه.",
  solar: "ارزیابی پتانسیل تابش سقف، برآورد هزینه احداث و بازگشت سرمایه بر اساس مصوبات ماده ۱۲ و ۱۶.",
  engineering: "محاسبه آنلاین افت ولتاژ، سایزینگ کابل، بانک خازنی و ژنراتور مطابق IEC با خروجی PDF قابل چاپ.",
  wiki: "دسترسی و جستجوی هوشمند در مقررات ملی ساختمان (مبحث ۱۳)، نشریه ۱۱۰ و آیین‌نامه‌های توانیر.",
};

const ctas: Record<string, string> = {
  audit: "ورود به پنل ممیزی",
  solar: "محاسبه طرح توجیهی",
  engineering: "استفاده از ابزارهای مهندسی",
  wiki: "ورود به دانشنامه",
};

/** شبکه‌ی ابزارها و ماژول‌ها — «Interactive Workspaces Grid» نوت ۴ §۳ */
export function ModuleCards() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 lg:px-8">
      <h2 className="text-2xl font-black sm:text-3xl">ماژول‌های پلتفرم</h2>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        چهار پنل مستقل که از یک لایه‌ی یکپارچه‌ی احراز هویت، کیف‌پول و دروازه‌ی هوش مصنوعی استفاده می‌کنند.
      </p>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {modules.map((module) => (
          <Card key={module.key} className="group transition-[transform,box-shadow] hover:-translate-y-0.5">
            <CardContent className="p-6">
              <span
                aria-hidden
                className="mb-4 block size-8 rounded-lg"
                style={{ backgroundColor: module.accent }}
              />
              <CardTitle>{module.title}</CardTitle>
              <CardDescription className="mt-2 leading-7">{descriptions[module.key]}</CardDescription>
            </CardContent>
            <CardFooter className="border-t border-border/60 px-6 py-4">
              <Link
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
                href={module.route}
              >
                {ctas[module.key]}
                <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}
