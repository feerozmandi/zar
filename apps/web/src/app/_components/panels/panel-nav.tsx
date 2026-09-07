import { SiteHeader } from "../layout/site-header";
import Link from "next/link";

export interface PanelNavProps {
  title: string;
  accent?: string;
  links: Array<{ href: string; label: string }>;
}

/** نوار ناوبری درون‌پنلی — مشترک همه‌ی پنل‌ها تا ساختار UI یکسان بماند */
export function PanelNav({ title, accent, links }: PanelNavProps) {
  return (
    <div className="border-b border-border/60 bg-card/30">
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-7xl items-center gap-4 overflow-x-auto px-4 pb-3 lg:px-8">
        <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
        <h1 className="shrink-0 text-sm font-bold">{title}</h1>
        <nav aria-label="بخش‌های پنل" className="flex gap-1 text-sm">
          {links.map((link) => (
            <Link
              className="rounded-lg px-3 py-1.5 text-muted-foreground hover:bg-secondary/10 hover:text-foreground"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
