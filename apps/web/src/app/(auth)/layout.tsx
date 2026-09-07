"use client";

import { useAuthStore } from "@/store/auth-store";
import { XENNIC_BRAND } from "@xennic/design-tokens";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, ArrowRight } from "lucide-react";

function AuthPortal({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const pathname = usePathname();

  const isLoginPage = pathname === "/login";
  const isRegisterPage = pathname === "/register";
  const authenticated = status === "authenticated";

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden p-4">
      {/* هاله انرژی — روی میدان WebGL و زیر کارت */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div
          className="absolute left-1/2 top-1/3 h-96 w-96 origin-center rounded-full opacity-25 blur-3xl"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, var(--xennic-primary) 0%, transparent 70%)",
            transform: "translate(-50%, -50%)",
          }}
        />
        <div
          className="absolute bottom-0 right-0 h-72 w-72 origin-center rounded-full opacity-20 blur-3xl"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, var(--xennic-secondary) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* کارت احراز هویت */}
      {!authenticated && (
        <div className="glass-panel bp-corner animate-fade-in-up relative z-10 w-full max-w-sm bg-card/70">
          {/* هدر کارت */}
          <div className="flex items-center justify-between px-6 pb-4 pt-6">
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">
                {isLoginPage
                  ? "خوش آمدید به Xennic"
                  : isRegisterPage
                    ? "ساخت حساب کاربری"
                    : "احراز هویت"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {isLoginPage
                  ? "با یک حساب، به همه‌ی پنل‌های تخصصی دسترسی پیدا کنید."
                  : "حساب خود را ایجاد کنید و از ابزارهای مهندسی هوشمند استفاده کنید."}
              </p>
            </div>
            <Link
              href="/"
              className="shrink-0 rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary/10 hover:text-foreground hover:scale-105"
              aria-label="بازگشت به صفحه اصلی"
            >
              <ArrowRight className="rotate-180 size-9" />
            </Link>
          </div>

          {/* بدنه کارت */}
          <div className="px-6 pb-6">{children}</div>

          {/* فوتر کارت */}
          <p className="mb-4 mt-2 text-center text-xs text-muted-foreground">
            با{" "}
            <Link
              href="/"
              className="font-semibold text-foreground transition-colors hover:text-primary hover:underline underline-offset-2 decoration-border/40 hover:decoration-primary"
            >
              {XENNIC_BRAND.name}
            </Link>
            {" · "}
            <Link
              href="/contact"
              className="font-medium text-muted-foreground transition-colors hover:text-foreground hover:underline underline-offset-2 decoration-border/40 hover:decoration-primary"
            >
              ارتباط با ما
            </Link>
          </p>
        </div>
      )}

      {/* اسپلش کوچک برند در گوشه */}
      {!authenticated && (
        <div className="absolute bottom-4 right-4 animate-fade-in-up rounded-full bg-card/60 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-md border border-border/40">
          <Sparkles size={12} className="text-primary" />
          <span className="ml-1.5 font-medium">Xennic</span>
        </div>
      )}
    </div>
  );
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthPortal>{children}</AuthPortal>;
}
