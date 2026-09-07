import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "فراموشی رمز عبور",
  robots: { index: false },
};

export default function ForgotPage() {
  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-bold">فراموشی رمز عبور</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        ایمیل خود را بنویسید تا لینک راه‌اندازی رمز برای شما ارسال شود.
      </p>
      <div className="mt-8">
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            عمل تعویض رمز در این مرحله در دسترس نیست؛ لطفاً از حساب خود
            برای ورود استفاده کنید یا با پشتیبانی تماس بگیرید.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            بازگشت به صفحه ورود
          </Link>
        </div>
      </div>
    </div>
  );
}