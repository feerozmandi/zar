"use client";

import { useAuthStore } from "@/store/auth-store";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { modules, routes } from "@xennic/design-tokens";
import { ThemeToggle } from "@/app/_components/layout/theme-toggle";
import { ROLES } from "@xennic/shared";
import { useCallback, useEffect, useState } from "react";
import { LogIn, UserCheck, ChevronDown, X, Shield, Sun, BarChart3, Zap } from "lucide-react";

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
        className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200 hover:bg-secondary/10 hover:scale-[1.02] active:scale-[0.98]"
        onClick={() => setShowMenu((v) => !v)}
        aria-expanded={showMenu}
      >
        <Icon size={16} className="text-primary" />
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground font-semibold">{user.email.split("@")[0]}</span>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${showMenu ? "rotate-180" : ""}`}
        />
      </button>

      {showMenu && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-border/60 bg-card/95 backdrop-blur-xl p-2 shadow-xl animate-scale-in z-50"
        >
          <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            حساب کاربری
          </div>
          <div className="grid gap-1">
            <Link
              href="/profile"
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-foreground transition-colors hover:bg-secondary/5"
              onClick={handleClose}
            >
              <UserCheck size={16} />
              پروفایل و تنظیمات
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary/5"
              onClick={handleClose}
            >
              <Shield size={16} />
              تنظیمات کاربر
            </Link>
          </div>
          <div className="my-2 border-t border-border/60" />
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-destructive hover:bg-destructive/10"
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

export function SiteHeader() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.status === "authenticated");
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/75 backdrop-blur-xl">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-primary/70 to-transparent"
        aria-hidden
      />
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-6 px-4 lg:px-8">
        {/* برند */}
        <Link href={routes.home} className="group flex items-center gap-3">
          <span
            className="pulse-spark grid size-9 place-items-center rounded-xl bg-gradient-to-br from-primary via-primary/80 to-accent font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-transform duration-300 group-hover:scale-105"
            aria-hidden
          >
            X
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-base font-bold tracking-tight text-foreground">Xennic</span>
            <span className="text-[11px] text-muted-foreground">زر نور نیرو یکتا</span>
          </span>
        </Link>

        {/* ناوبری ماژول‌ها */}
        <nav aria-label="ناوبری اصلی" className="hidden flex-wrap items-center gap-1.5 lg:flex">
          {modules.map((module) => {
            const active = pathname === module.route || pathname.startsWith(`${module.route}/`);
            return (
              <Link
                key={module.key}
                href={module.route}
                className="relative rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 hover:bg-secondary/10 hover:text-foreground"
              >
                {module.title}
                <span
                  aria-hidden
                  className={`absolute inset-x-3 -bottom-px h-px bg-gradient-to-l from-transparent via-primary to-transparent transition-opacity duration-300 ${
                    active ? "opacity-100" : "opacity-0"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        {/* کنترل‌های سمت راست: تم + ورود/ثبت‌نام / پروفایل */}
        <div className="flex items-center gap-1.5">
          <ThemeToggle />

          {isAuthenticated && user ? (
            <UserPill />
          ) : (
            <>
              <Link
                href={routes.login}
                className="hidden rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:text-foreground hover:bg-secondary/10 sm:inline-flex"
              >
                ورود
              </Link>
              <Link
                href={routes.register}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-gradient-to-br from-primary to-accent px-4 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all duration-200 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.97]"
              >
                <LogIn size={14} />
                شروع رایگان
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
