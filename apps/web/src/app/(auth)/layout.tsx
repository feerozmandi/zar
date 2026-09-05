import { XENNIC_BRAND } from "@xennic/design-tokens";
import Link from "next/link";

/** چیدمان ورود/ثبت‌نام — SSO یکپارچه برای همه‌ی پنل‌ها (نوت ۳ §۳) */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="xennic-grid-lines hidden flex-col justify-between bg-card/40 p-10 lg:flex">
        <Link className="text-xl font-black" href="/">
          {XENNIC_BRAND.name}
        </Link>
        <p className="max-w-sm text-sm leading-8 text-muted-foreground">
          یک حساب، چهار پنل تخصصی: ممیزی قبض، امکان‌سنجی خورشیدی، جعبه‌ابزار مهندسی و دانشنامه‌ی قوانین برق.
        </p>
      </div>
      <main className="flex items-center justify-center px-4 py-12">{children}</main>
    </div>
  );
}
