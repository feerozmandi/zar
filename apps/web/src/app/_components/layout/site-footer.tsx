import { modules, routes, XENNIC_BRAND } from "@xennic/design-tokens";
import Link from "next/link";

/** فوتر سازمانی با لینک‌های سریع و اطلاعات تماس (نوت ۴ §۶) */
export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-card/40">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 md:grid-cols-4 lg:px-8">
        <div className="md:col-span-2">
          <p className="text-lg font-bold">{XENNIC_BRAND.name}</p>
          <p className="mt-2 max-w-md text-sm leading-7 text-muted-foreground">
            {XENNIC_BRAND.legalName} — {XENNIC_BRAND.tagline}
          </p>
        </div>

        <nav aria-label="پنل‌ها">
          <p className="mb-3 text-sm font-bold">پنل‌های پلتفرم</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {modules.map((module) => (
              <li key={module.key}>
                <Link className="hover:text-primary" href={module.route}>
                  {module.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="شرکت">
          <p className="mb-3 text-sm font-bold">شرکت</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href={routes.about}>درباره ما</Link>
            </li>
            <li>
              <Link href={routes.contact}>درخواست مشاوره</Link>
            </li>
            <li>
              <Link href={routes.ai}>مقایسه مدل‌های هوش مصنوعی</Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">
        کلیه حقوق مادی و معنوی این پلتفرم متعلق به {XENNIC_BRAND.legalName} ({XENNIC_BRAND.name}) می‌باشد.
      </div>
    </footer>
  );
}
