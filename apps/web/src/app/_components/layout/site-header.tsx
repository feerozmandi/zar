"use client";

import { modules, routes } from "@xennic/design-tokens";
import {
  BarChart3,
  ChevronDown,
  ClipboardCheck,
  DraftingCompass,
  FileSearch,
  Gauge,
  HardHat,
  LogIn,
  Menu,
  Shield,
  Sun,
  UserCheck,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { ThemeToggle } from "@/app/_components/layout/theme-toggle";
import { ROLES } from "@xennic/shared";

/* ─── داده‌ی منوها ─── */

const serviceMenu = [
  { icon: ClipboardCheck, title: "مشاوره و مطالعات پایه", href: `${routes.home}#services` },
  { icon: DraftingCompass, title: "طراحی و مهندسی اجرایی", href: `${routes.home}#services` },
  { icon: HardHat, title: "اجرا و مدیریت EPC", href: `${routes.home}#services` },
  { icon: Gauge, title: "بهره‌برداری و نگهداشت", href: `${routes.home}#services` },
  { icon: FileSearch, title: "ممیزی انرژی و تحلیل قبض", href: routes.audit },
  { icon: Sun, title: "امکان‌سنجی نیروگاه خورشیدی", href: routes.solar },
];

const toolMenu = modules.map((module) => ({
  title: module.title,
  href: module.route,
  accent: module.accent,
}));

const simpleLinks = [
  { title: "درباره ما", href: routes.about },
  { title: "تماس با ما", href: routes.contact },
];

const ROLE_ICONS: Record<string, React.ElementType> = {
  [ROLES.superAdmin]: Shield,
  [ROLES.proEngineer]: Zap,
  [ROLES.epcPartner]: Sun,
  [ROLES.user]: BarChart3,
};

const ROLE_LABELS: Record<string, string> = {
  [ROLES.superAdmin]: "مدیر ارشد",
  [ROLES.proEngineer]: "مهندس",
  [ROLES.epcPartner]: "مجری EPC",
  [ROLES.user]: "کاربر",
};

/* ─── نشان کاربر واردشده ─── */

function UserPill() {
  const user = useAuthStore((s) => s.user);
  const [showMenu, setShowMenu] = useState(false);
  const role = user?.role ?? ROLES.user;

  const handleClose = useCallback(() => setShowMenu(false), []);

  useEffect(() => {
    if (!showMenu) return;
    const onDoc = (e: MouseEvent) => {
      if (!(e.target instanceof Element)) return;
      if (!e.target.closest("[data-user-pill]")) setShowMenu(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [showMenu]);

  if (!user) return null;

  const Icon = ROLE_ICONS[role] ?? BarChart3;
  const label = ROLE_LABELS[role] ?? "کاربر";

  return (
    <div className="relative" data-user-pill>
      <button
        type="button"
        className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors hover:bg-secondary/10"
        onClick={() => setShowMenu((v) => !v)}
        aria-expanded={showMenu}
      >
        <Icon size={16} className="text-primary" />
        <span className="font-semibold">{user.email.split("@")[0]}</span>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${showMenu ? "rotate-180" : ""}`}
        />
      </button>

      {showMenu && (
        <div
          role="menu"
          className="absolute left-0 top-full z-50 mt-3 w-56 rounded-2xl border border-border/60 bg-card/95 p-2 shadow-xl backdrop-blur-xl animate-scale-in"
        >
          <div className="px-3 py-2 text-xs font-medium tracking-wider text-muted-foreground">
            {label} — حساب کاربری
          </div>
          <Link
            href="/profile"
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-secondary/10"
            onClick={handleClose}
          >
            <UserCheck size={16} />
            پروفایل و تنظیمات
          </Link>
          <div className="my-2 border-t border-border/60" />
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            onClick={() => {
              void useAuthStore.getState().signOut();
              setShowMenu(false);
            }}
          >
            <X size={16} />
            خروج از حساب
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── منوی آبشاری دسکتاپ ─── */

function NavDropdown({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="group relative">
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground group-focus-visible:text-foreground"
        aria-haspopup="true"
      >
        {label}
        <ChevronDown
          size={14}
          className="transition-transform duration-300 group-hover:rotate-180"
          aria-hidden
        />
      </button>

      {/* پل نامرئی برای حفظ hover تا پنل */}
      <div className="absolute top-full right-0 invisible pt-2 opacity-0 transition-[visibility,opacity,transform] duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        <div className="origin-top rounded-2xl border border-border/60 bg-card/95 p-3 shadow-2xl shadow-black/30 backdrop-blur-2xl animate-scale-in">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─── هدر اصلی ─── */

export function SiteHeader() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.status === "authenticated");
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    // مقداردهی اولیه خارج از فاز همگامِ effect (برای رعایت قانون cascading render)
    const raf = requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // قفل اسکرول بدنه هنگام باز بودن منوی موبایل + بستن با Escape
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  const linkBase = "rounded-lg px-3 py-2 text-sm font-medium transition-colors";
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-border/60 bg-background/80 shadow-lg shadow-black/5 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 lg:h-[72px] lg:px-8">
        {/* برند */}
        <Link href={routes.home} className="group flex items-center gap-3" aria-label="Xennic — صفحه اصلی">
          <span
            aria-hidden
            className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-primary via-primary/80 to-accent font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-transform duration-300 group-hover:scale-105"
          >
            X
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-base font-bold tracking-tight">Xennic</span>
            <span className="text-[11px] text-muted-foreground">زر نور نیرو یکتا</span>
          </span>
        </Link>

        {/* ناوبری دسکتاپ */}
        <nav aria-label="ناوبری اصلی" className="hidden items-center gap-0.5 lg:flex">
          <NavDropdown label="خدمات مهندسی">
            <div className="grid w-[26rem] grid-cols-2 gap-1">
              {serviceMenu.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-secondary/10"
                >
                  <item.icon size={16} className="shrink-0 text-primary" aria-hidden />
                  {item.title}
                </Link>
              ))}
            </div>
          </NavDropdown>

          <NavDropdown label="ابزارهای هوشمند">
            <div className="grid w-80 gap-1">
              {toolMenu.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-secondary/10"
                >
                  <span
                    aria-hidden
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: item.accent }}
                  />
                  {item.title}
                </Link>
              ))}
            </div>
          </NavDropdown>

          {simpleLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${linkBase} ${
                isActive(link.href) ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.title}
            </Link>
          ))}
        </nav>

        {/* کنترل‌های سمت راست */}
        <div className="flex items-center gap-1.5">
          <ThemeToggle />

          {isAuthenticated && user ? (
            <UserPill />
          ) : (
            <>
              <Link
                href={routes.login}
                className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/10 hover:text-foreground sm:inline-flex"
              >
                ورود
              </Link>
              <Link
                href={routes.register}
                className="hidden h-9 items-center gap-1.5 rounded-full bg-gradient-to-br from-primary to-accent px-4 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all duration-200 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.97] sm:inline-flex"
              >
                <LogIn size={14} />
                شروع رایگان
              </Link>
            </>
          )}

          {/* دکمه منوی موبایل */}
          <button
            type="button"
            className="grid size-9 place-items-center rounded-lg text-foreground transition-colors hover:bg-secondary/10 lg:hidden"
            onClick={() => setDrawerOpen(true)}
            aria-label="باز کردن منو"
            aria-expanded={drawerOpen}
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* ─── منوی موبایل تمام‌صفحه ─── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="منوی ناوبری"
        >
          <div
            className="absolute inset-0 bg-background/95 backdrop-blur-2xl"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <div className="animate-fade-in-up relative flex h-full flex-col overflow-y-auto px-6 pt-5 pb-10">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-primary via-primary/80 to-accent font-bold text-primary-foreground"
                >
                  X
                </span>
                <span className="text-base font-bold">Xennic</span>
              </span>
              <button
                type="button"
                className="grid size-10 place-items-center rounded-lg transition-colors hover:bg-secondary/10"
                onClick={() => setDrawerOpen(false)}
                aria-label="بستن منو"
              >
                <X size={22} />
              </button>
            </div>

            <nav
              aria-label="ناوبری موبایل"
              className="mt-10 flex flex-col gap-8"
              onClick={(e) => {
                // بستن منو با کلیک/لمس هر لینک
                if (e.target instanceof Element && e.target.closest("a")) setDrawerOpen(false);
              }}
            >
              <section>
                <p className="mb-3 text-xs font-bold tracking-wider text-muted-foreground">خدمات مهندسی</p>
                <div className="grid grid-cols-1 gap-1">
                  {serviceMenu.map((item, index) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      style={{ animationDelay: `${index * 40}ms` }}
                      className="animate-stagger-in flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium transition-colors hover:bg-secondary/10"
                    >
                      <item.icon size={18} className="text-primary" aria-hidden />
                      {item.title}
                    </Link>
                  ))}
                </div>
              </section>

              <section>
                <p className="mb-3 text-xs font-bold tracking-wider text-muted-foreground">ابزارهای هوشمند</p>
                <div className="grid grid-cols-1 gap-1">
                  {toolMenu.map((item, index) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      style={{ animationDelay: `${(index + 6) * 40}ms` }}
                      className="animate-stagger-in flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium transition-colors hover:bg-secondary/10"
                    >
                      <span
                        aria-hidden
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: item.accent }}
                      />
                      {item.title}
                    </Link>
                  ))}
                </div>
              </section>

              <section className="grid grid-cols-2 gap-1">
                {simpleLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-xl px-3 py-3 text-[15px] font-medium transition-colors hover:bg-secondary/10"
                  >
                    {link.title}
                  </Link>
                ))}
              </section>
            </nav>

            <div className="mt-auto pt-10">
              {isAuthenticated && user ? (
                <button
                  type="button"
                  className="w-full rounded-xl border border-border/70 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => {
                    void useAuthStore.getState().signOut();
                    setDrawerOpen(false);
                  }}
                >
                  خروج از حساب
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href={routes.login}
                    className="rounded-xl border border-border/70 py-3 text-center text-sm font-semibold"
                  >
                    ورود
                  </Link>
                  <Link
                    href={routes.register}
                    className="rounded-xl bg-gradient-to-br from-primary to-accent py-3 text-center text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25"
                  >
                    شروع رایگان
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
