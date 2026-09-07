import type { Metadata } from "next";
import { LoginForm } from "../../_components/auth/auth-forms";

export const metadata: Metadata = { title: "ورود به پلتفرم", robots: { index: false } };

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-black">ورود یکپارچه</h1>
      <p className="mt-2 text-sm text-muted-foreground">با یک حساب وارد همه‌ی پنل‌های Xennic شوید.</p>
      <div className="mt-8">
        <LoginForm mode="login" />
      </div>
    </div>
  );
}
