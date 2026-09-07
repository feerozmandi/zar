import { SiteHeader } from "../layout/site-header";
import Link from "next/link";

export interface PanelNavProps {
  title: string;
  accent?: string;
  links: Array<{ href: string; label: string }>;
}

/** نوار ناوبری درون‌پنلی — بلوپرینت فنی مشترک همه‌ی پنل‌ها: خط‌کشی، گوشه‌ای و حاشیه‌نویسی */
export function PanelNav({ title, accent, links }: PanelNavProps) {
  return (
    <div className="bp-inlay border-b border-border/60 bg-card/30">
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-7xl items-center gap-4 overflow-x-auto border-dashed border-border/40 px-4 pb-3 lg:px-8">
        <span aria-hidden className="pulse-spark size-2.5 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
        <h1 className="shrink-0 text-sm font-bold text-foreground">{title}</h1>
        <nav aria-label="بخش‌های پنل" className="flex gap-1 text-sm">
          {links.map((link) => (
            <Link
              className="rounded-lg px-3 py-1.5 text-muted-foreground transition-colors hover:bg-secondary/10 hover:text-foreground"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        {/* حاشیه‌گذاری فنی شبه‌بعد (بلوپرینت) */}
        <span aria-hidden className="mr-auto hidden shrink-0 font-mono text-[10px] tracking-widest text-muted-foreground/70 md:inline">
          XN-{links.length.toString().padStart(2, "0")} · EEC
        </span>
      </div>
    </div>
  );
}