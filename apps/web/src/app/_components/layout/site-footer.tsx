import { modules, routes, XENNIC_BRAND } from "@xennic/design-tokens";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const serviceLinks = [
  { title: "مشاوره و مطالعات پایه", href: `${routes.home}#services` },
  { title: "طراحی و مهندسی", href: `${routes.home}#services` },
  { title: "اجرا و مدیریت EPC", href: `${routes.home}#services` },
  { title: "بهره‌برداری و نگهداشت", href: `${routes.home}#services` },
];

const companyLinks = [
  { title: "درباره ما", href: routes.about },
  { title: "درخواست مشاوره", href: routes.contact },
  { title: "مقایسه مدل‌های هوش مصنوعی", href: routes.ai },
];

/** فوتر سازمانی — گرادیان عمیق با درخشش ملایم و لینک‌های دسترسی سریع (نوت ۴ §۶ بازطراحی‌شده) */
export function SiteFooter() {
  return (
    <footer className="relative mt-8 overflow-hidden border-t border-border/60 bg-gradient-to-b from-card/40 to-background">
      {/* درخشش‌های ملایم پس‌زمینه */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-64 w-[42rem] -translate-x-1/2 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute right-[-6rem] bottom-[-8rem] size-72 rounded-full bg-accent/6 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 pt-16 pb-10 lg:px-8 lg:pt-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:gap-8">
          {/* برند و معرفی */}
          <div>
            <Link href={routes.home} className="flex items-center gap-3" aria-label="Xennic — صفحه اصلی">
              <span
                aria-hidden
                className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-primary via-primary/80 to-accent font-bold text-primary-foreground shadow-lg shadow-primary/20"
              >
                X
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-lg font-bold tracking-tight">{XENNIC_BRAND.name}</span>
                <span className="text-[11px] text-muted-foreground">{XENNIC_BRAND.legalNameLatin}</span>
              </span>
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-7 text-muted-foreground">
              {XENNIC_BRAND.legalName} — مشاور، طراح و مجری خدمات مهندسی برق و انرژی‌های نو؛ خالق پلتفرم
              هوشمند {XENNIC_BRAND.name} برای ممیزی انرژی، امکان‌سنجی خورشیدی و محاسبات مهندسی.
            </p>
            <Link
              href={routes.contact}
              className="group mt-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              درخواست مشاوره‌ی رایگان
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
            </Link>
          </div>

          {/* خدمات */}
          <nav aria-label="خدمات مهندسی">
            <p className="text-sm font-bold">خدمات مهندسی</p>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              {serviceLinks.map((link) => (
                <li key={link.title}>
                  <Link className="transition-colors hover:text-primary" href={link.href}>
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* ابزارهای پلتفرم */}
          <nav aria-label="ابزارهای پلتفرم">
            <p className="text-sm font-bold">ابزارهای پلتفرم</p>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              {modules.map((module) => (
                <li key={module.key}>
                  <Link className="transition-colors hover:text-primary" href={module.route}>
                    {module.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* شرکت */}
          <nav aria-label="شرکت">
            <p className="text-sm font-bold">شرکت</p>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link className="transition-colors hover:text-primary" href={link.href}>
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* نوار پایانی */}
        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-6 text-center text-xs text-muted-foreground sm:flex-row sm:text-start">
          <p>
            © {new Intl.NumberFormat("fa-IR").format(new Date().getFullYear())} کلیه حقوق مادی و معنوی این
            پلتفرم متعلق به {XENNIC_BRAND.legalName} ({XENNIC_BRAND.name}) می‌باشد.
          </p>
          <p className="inline-flex items-center gap-2">
            <span aria-hidden className="size-1.5 rounded-full bg-primary" />
            مهندسی، نوآوری برای آینده‌ی انرژی
          </p>
        </div>
      </div>
    </footer>
  );
}
