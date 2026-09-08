"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  ChartNoAxesCombined,
  FileChartColumn,
  Handshake,
  Map,
  PanelsTopLeft,
  Sun,
} from "lucide-react";

const links = [
  { href: "/solar", label: "امکان‌سنجی", hint: "برآورد ظرفیت و صرفه‌جویی", icon: ChartNoAxesCombined },
  { href: "/solar/map", label: "نقشه تابش", hint: "شناخت پتانسیل موقعیت پروژه", icon: Map },
  { href: "/solar/roof-designer", label: "طراح سقف", hint: "ترسیم سقف و چیدمان پنل‌ها", icon: PanelsTopLeft },
  {
    href: "/solar/feasibility-report",
    label: "طرح توجیهی",
    hint: "تحلیل مالی و مقایسه سناریوها",
    icon: FileChartColumn,
  },
  { href: "/solar/marketplace", label: "مارکت‌پلیس EPC", hint: "مقایسه پیشنهادهای اجرا", icon: Handshake },
];

/** مسیر عمودی پروژه؛ مستقل از ناوبری سایر ماژول‌ها. */
export function SolarNav() {
  const pathname = usePathname();

  return (
    <aside className="self-start overflow-hidden rounded-3xl border border-amber-500/20 bg-card/90 shadow-xl shadow-black/5 backdrop-blur-xl xl:sticky xl:top-6 print:hidden">
      <div className="border-b border-border/60 bg-gradient-to-bl from-amber-500/15 to-transparent p-6">
        <span className="mb-5 inline-flex size-12 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <Sun aria-hidden className="size-6" />
        </span>
        <p className="mb-2 text-xs font-medium text-amber-700 dark:text-amber-400">انرژی پاک، آینده روشن</p>
        <h2 className="text-lg font-bold">نیروگاه خورشیدی</h2>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">
          از شناخت ظرفیت تا انتخاب مجری، قدم‌به‌قدم همراه پروژه شما.
        </p>
      </div>
      <nav aria-label="بخش‌های خورشیدی" className="flex flex-col gap-2 p-3">
        {links.map(({ href, label, hint, icon: Icon }) => {
          const active = pathname === href || (href !== "/solar" && pathname.startsWith(`${href}/`));
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`group flex items-center gap-3 rounded-2xl border p-3 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${active ? "border-amber-500/35 bg-amber-500/10 text-foreground" : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground"}`}
            >
              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${active ? "bg-amber-500 text-slate-950 shadow-sm" : "bg-muted/60"}`}
              >
                <Icon aria-hidden className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{label}</span>
                <span className="mt-1 block text-[11px] leading-5 text-muted-foreground">{hint}</span>
              </span>
              {active ? (
                <ArrowLeft aria-hidden className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
              ) : null}
            </Link>
          );
        })}
      </nav>
      <p className="mx-5 mb-5 mt-2 border-t border-border/60 pt-4 text-[11px] leading-6 text-muted-foreground">
        برآورد اولیه رایگان است؛ برای ذخیره پروژه و ارسال به مجری وارد حساب شوید.
      </p>
    </aside>
  );
}
