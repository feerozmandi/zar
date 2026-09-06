import type { Metadata } from "next";
import { LoginForm } from "../../_components/auth/auth-forms";

export const metadata: Metadata = { title: "ثبت‌نام در Xennic", robots: { index: false } };

export default function RegisterPage() {
  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-black">ساخت حساب کاربری</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        تحلیل اولیه‌ی قبض برق رایگان است؛ برای محاسبات مهندسی و طرح توجیهی سولار، حساب بسازید.
      </p>
      <div className="mt-8">
        <LoginForm mode="register" />
      </div>
    </div>
  );
}
