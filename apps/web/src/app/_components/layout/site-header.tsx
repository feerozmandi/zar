import { modules, routes } from "@xennic/design-tokens";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

/** سربرگ سازمانی — لینک مستقیم به چهار پنل اصلی (نوت ۴ §۳) */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-6 px-4 lg:px-8">
        <Link href={routes.home} className="flex items-center gap-3">
          <span
            aria-hidden
            className="grid size-9 place-items-center rounded-xl bg-primary font-bold text-primary-foreground"
          >
            X
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-base font-bold">Xennic</span>
            <span className="text-[11px] text-muted-foreground">زر نور نیرو یکتا</span>
          </span>
        </Link>

        <nav aria-label="ناوبری اصلی" className="hidden items-center gap-1 lg:flex">
          {modules.map((module) => (
            <Link
              key={module.key}
              href={module.route}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/10 hover:text-foreground"
            >
              {module.title}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href={routes.login}
            className="hidden rounded-lg px-3 py-2 text-sm font-medium sm:inline-flex"
          >
            ورود
          </Link>
          <Link
            href={routes.register}
            className="inline-flex h-9 items-center rounded-(--radius-button) bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            شروع رایگان
          </Link>
        </div>
      </div>
    </header>
  );
}
