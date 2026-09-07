"use client";

import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from "@xennic/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button, Input, Label } from "@xennic/ui";
import { apiFetch } from "@/lib/api-client";
import { authTokensSchema } from "@/lib/auth-types";
import { useAuthStore, defaultRedirectForRole } from "@/store/auth-store";
import type { ApiError } from "@/lib/api-client";
import { z } from "zod";

type AuthFormValues = { email: string; password: string; fullName?: string };

/** ترجمه‌ی پیام‌های خطای رایج سرور به پیام کاربری کاربردی‌تر */
const SERVER_ERROR_MAP: Record<string, string> = {
  "ایمیل یا رمز عبور نادرست است": "ایمیل یا رمز عبور اشتباه است.",
  "حساب کاربری غیرفعال است": "این حساب کاربری غیرفعال شده است.",
  "حساب شما هنوز تأیید نشده است":
    "حساب شما هنوز تأیید نشده است. پس از تأیید ایمیل وارد شوید.",
  "این ایمیل قبلاً ثبت شده است": "این ایمیل قبلاً ثبت نام کرده است.",
};

function humanError(raw: unknown): string {
  if (raw instanceof Error && "status" in raw) {
    const e = raw as ApiError;
    const msg = e.message;
    if (e.issues && e.issues.length > 0) {
      const first = e.issues[0];
      if (first) return first.message;
    }
    if (msg) {
      const mapped = SERVER_ERROR_MAP[msg];
      if (mapped) return mapped;
    }
    return msg ?? "خطا در احراز هویت.";
  }
  return "خطا در ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی کنید.";
}

export function LoginForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const signIn = useAuthStore((state) => state.signIn);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isLogin = mode === "login";
  const methods = useForm<AuthFormValues, unknown, LoginInput | RegisterInput>({
    resolver: zodResolver(isLogin ? loginSchema : registerSchema),
  });
  const { register, handleSubmit, formState } = methods;

  // ورود خودکار با اعتبارنامه‌ی موجود در query string (مثل تست لوکال:
  // /login?email=...&password=...). فقط برای حالت ورود و فقط یکبار اجرا می‌شود.
  const autoLoginRan = useRef(false);
  useEffect(() => {
    if (!isLogin || autoLoginRan.current) return;
    const email = searchParams.get("email");
    const password = searchParams.get("password");
    if (!email || !password) return;
    autoLoginRan.current = true;
    methods.setValue("email", email);
    methods.setValue("password", password);
    void methods.handleSubmit(onSubmit)();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(values: LoginInput | RegisterInput) {
    setPending(true);
    try {
      if (isLogin) {
        const result = await apiFetch("auth/login", authTokensSchema, {
          method: "POST",
          body: values,
        });
        signIn(result.user, result.accessToken);
        const redirect = defaultRedirectForRole(result.user.role);
        toast.success(`ورود موفق؛ خوش آمدید ${result.user.email}`);
        router.replace(redirect);
      } else {
        await apiFetch("auth/register", z.object({ id: z.string() }), {
          method: "POST",
          body: values,
        });
        toast.success(
          "حساب کاربری ساخته شد؛ پس از تأیید ایمیل می‌توانید وارد شوید.",
        );
        router.replace("/login");
      }
    } catch (err) {
      toast.error(humanError(err));
    } finally {
      setPending(false);
    }
  }

  return (      <div
      className="rounded-2xl p-6 animate-fade-in-up"
    >
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          void handleSubmit(onSubmit)(event);
        }}
      >
        <Field
          error={formState.errors.email?.message}
          htmlFor="email"
          label="ایمیل"
        >
          <Input dir="ltr" id="email" type="email" {...register("email")} />
        </Field>
        {!isLogin && (
          <Field
            error={formState.errors.fullName?.message}
            htmlFor="fullName"
            label="نام کامل"
          >
            <Input id="fullName" {...register("fullName")} />
          </Field>
        )}
        <Field
          error={formState.errors.password?.message}
          htmlFor="password"
          label="رمز عبور"
        >
          <div className="relative">
            <Input
              dir="ltr"
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete={isLogin ? "current-password" : "new-password"}
              className="pr-10"
              {...register("password")}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "پنهان‌سازی رمز" : "نمایش رمز"}
            >
              {pending ? null : showPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>
        </Field>
        {!isLogin && (
          <p className="text-xs text-muted-foreground">
            رمز عبور حداقل ۱۰ نویسه باشد و شامل حروف لاتین و عدد باشد.
          </p>
        )}
        <Button disabled={pending} type="submit" className="w-full">
          {pending ? (
            <>
              <Loader2 className="mr-2 animate-spin" size={16} />
              {isLogin ? "در حال ورود..." : "در حال ثبت..."}
            </>
          ) : isLogin ? (
            "ورود"
          ) : (
            "ثبت‌نام"
          )}
        </Button>
      </form>
      {isLogin && (
        <div className="mt-4 border-t border-border/50 pt-4 text-center">
          <Link
            href="/forgot"
            className="inline-block text-sm text-muted-foreground transition-colors hover:text-foreground hover:underline underline-offset-2 decoration-border/40 hover:decoration-primary"
          >
            فراموشی رمز عبور؟
          </Link>
        </div>
      )}
      <p className="mt-4 text-center text-xs text-muted-foreground">
        {isLogin ? (
          <>
            حساب ندارید؟{" "}
            <Link
              href="/register"
              className="font-medium text-foreground transition-colors hover:text-primary hover:underline underline-offset-2 decoration-border/40 hover:decoration-primary"
            >
              ثبت‌نام کنید
            </Link>
          </>
        ) : (
          <>
            قبلاً ثبت‌نام کردید؟{" "}
            <Link
              href="/login"
              className="font-medium text-foreground transition-colors hover:text-primary hover:underline underline-offset-2 decoration-border/40 hover:decoration-primary"
            >
              ورود
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

function Field({
  children,
  error,
  htmlFor,
  label,
}: {
  children: React.ReactNode;
  error?: string;
  htmlFor: string;
  label: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive animate-fade-in">{error}</p>
      ) : null}
    </div>
  );
}
