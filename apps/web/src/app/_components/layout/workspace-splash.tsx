"use client";

import { useAuthStore } from "@/store/auth-store";
import { usePathname, useRouter } from "next/navigation";
import { ROLES } from "@xennic/shared";
import { useEffect, useState } from "react";
import { Building2, Zap, Sun, BarChart3, Shield, ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { cn } from "@xennic/ui";

const ROLE_CONFIG: {
  [key in string]: {
    label: string;
    icon: React.ElementType;
    home: string;
    colorClass: string;
  };
} = {
  [ROLES.superAdmin]: {
    label: "مدیر ارشد پلتفرم",
    icon: Shield,
    home: "/admin",
    colorClass: "text-destructive",
  },
  [ROLES.proEngineer]: {
    label: "مهندس برق",
    icon: Zap,
    home: "/engineering",
    colorClass: "text-primary",
  },
  [ROLES.epcPartner]: {
    label: "مجری پروژه‌های خورشیدی",
    icon: Sun,
    home: "/solar",
    colorClass: "text-secondary",
  },
  [ROLES.user]: {
    label: "کاربر پلتفرم",
    icon: BarChart3,
    home: "/audit",
    colorClass: "text-muted-foreground",
  },
};

function QuickActions({ role }: { role: string }) {
  const cfg = (ROLE_CONFIG[role] ?? ROLE_CONFIG[ROLES.user]) as {
    label: string;
    icon: React.ElementType;
    home: string;
    colorClass: string;
  };
  const actionItems: Array<{
    href: string;
    label: string;
    icon: React.ElementType;
    colorClass: string;
  }> = [
    { href: cfg.home, label: cfg.label, icon: cfg.icon, colorClass: cfg.colorClass },
    {
      href: "/profile",
      label: "پروفایل و تنظیمات",
      icon: Building2,
      colorClass: "text-muted-foreground",
    },
    {
      href: "/api",
      label: "کلیدهای API (BYOK)",
      icon: Zap,
      colorClass: "text-secondary",
    },
  ];

  return (
    <nav aria-label="دستیات سریع" className="grid gap-1">
      {actionItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 px-3.5 py-2.5 transition-all duration-200 hover:border-primary/40 hover:bg-secondary/5 hover:text-foreground hover:scale-[1.01] hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <item.icon
            size={16}
            className={cn("shrink-0 transition-colors group-hover:scale-110", item.colorClass)}
          />
          <span className="text-sm text-foreground font-medium">{item.label}</span>
          <ChevronRight
            size={14}
            className="ml-auto shrink-0 text-muted-foreground transition-all duration-200 group-hover:translate-x-1 group-hover:text-foreground"
          />
        </Link>
      ))}
    </nav>
  );
}

export function WorkspaceSplash() {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // فقط در صفحه‌ی نخست (لندینگ) نمایش داده شود؛ در بقیه صفحات «پنجره»
  // مدیریت نباید باز بماند، چون آنجا ناوبری/پنل مخصوص خودشان وجود دارد.
  const show = mounted && status === "authenticated" && !!user && pathname === "/";
  if (!show) return null;

  const role = user.role ?? ROLES.user;
  const cfg = (ROLE_CONFIG[role] ?? ROLE_CONFIG[ROLES.user]) as {
    label: string;
    icon: React.ElementType;
    home: string;
    colorClass: string;
  };
  const Icon = cfg.icon;

  return (
    <div className="bp-corner mx-auto mb-6 w-full max-w-2xl rounded-2xl border border-border/60 bg-card/40 px-5 py-4 shadow-lg animate-fade-in-up backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* چپ: آیکون + عنوان */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card/80 ring-1 ring-inset ring-border/40">
            <Icon size={20} className={cn("text-foreground", cfg.colorClass)} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              خوش آمدید، <span className="font-bold text-primary">{user.email.split("@")[0]}</span>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {cfg.label}
              {" · "}
              <button
                type="button"
                onClick={() => router.push(cfg.home)}
                className="font-medium text-foreground transition-colors hover:text-primary underline underline-offset-2 decoration-border/40 hover:decoration-primary"
              >
                ورود به workspace
              </button>
            </p>
          </div>
        </div>

        {/* راست: دست液ات */}
        <div className="flex items-center gap-2">
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-foreground transition-all duration-200 hover:bg-primary/20 hover:text-primary"
          >
            <Sparkles size={12} className="text-primary" />
            تنظیمات
          </Link>
          <Link
            href="/api"
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all duration-200 hover:border-primary/40 hover:text-foreground hover:bg-secondary/5"
          >
            کلیدهای API
          </Link>
        </div>
      </div>

      {/* دستیات سریع مرکزی */}
      <div className="mt-4 grid gap-1">
        <QuickActions role={role} />
      </div>

      {/* لینک‌های زیرموفق */}
      <div className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
        <Link
          href="/wiki/articles"
          className="rounded-lg px-2 py-0.5 transition-colors hover:text-foreground hover:underline underline-offset-2 decoration-border/40 hover:decoration-primary"
        >
          دانشنامه
        </Link>
        <span className="shrink-0">·</span>
        <Link
          href="/wiki/search?q=قانون"
          className="rounded-lg px-2 py-0.5 transition-colors hover:text-foreground hover:underline underline-offset-2 decoration-border/40 hover:decoration-primary"
        >
          جستجوی قوانین
        </Link>
        <span className="shrink-0">·</span>
        <Link
          href="/contact"
          className="rounded-lg px-2 py-0.5 transition-colors hover:text-foreground hover:underline underline-offset-2 decoration-border/40 hover:decoration-primary"
        >
          درخواست مشاوره
        </Link>
        <span className="shrink-0">·</span>
        <Link
          href={cfg.home}
          className="rounded-lg px-2 py-0.5 text-foreground font-medium transition-colors hover:text-primary hover:underline underline-offset-2 decoration-border/40 hover:decoration-primary"
        >
          ورود به workspace →
        </Link>
      </div>
    </div>
  );
}
