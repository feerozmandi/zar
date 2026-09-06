"use client";

import { useRouter } from "next/navigation";
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from "@xennic/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Button, Card, CardContent, Input, Label } from "@xennic/ui";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";

/**
 * فرم‌های احراز هویت. هر دو حالت از همان registerSchema/loginSchema مشترک
 * در @xennic/shared استفاده می‌کنند (یک منبع، دو مصرف‌کننده).
 */
type AuthFormValues = { email: string; password: string; fullName?: string };

export function LoginForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const signIn = useAuthStore((state) => state.signIn);
  const [pending, setPending] = useState(false);

  const isLogin = mode === "login";
  // مقادیر فرم زیرمجموعه‌ی هر دو اسکیمای login/register است؛ تبدیل نهایی با zod انجام می‌شود
  const methods = useForm<AuthFormValues, unknown, LoginInput | RegisterInput>({
    resolver: zodResolver(isLogin ? loginSchema : registerSchema),
  });
  const { register, handleSubmit, formState } = methods;

  async function onSubmit(values: LoginInput | RegisterInput) {
    setPending(true);
    try {
      if (isLogin) {
        const result = await apiFetch(
          "auth/login",
          z.object({
            accessToken: z.string(),
            refreshToken: z.string(),
            expiresIn: z.string(),
            user: z.object({ id: z.string(), email: z.string(), role: z.string() }),
          }),
          { method: "POST", body: values },
        );
        signIn(
          { id: result.user.id, email: result.user.email, role: result.user.role },
          result.accessToken,
        );
        toast.success("ورود موفق");
        router.push("/audit");
      } else {
        await apiFetch("auth/register", z.object({ id: z.string() }), { method: "POST", body: values });
        toast.success("حساب ساخته شد؛ پس از تأیید ایمیل می‌توانید وارد شوید");
        router.push("/login");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "خطا در احراز هویت");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-0">
        <form
          className="grid gap-4 p-6"
          onSubmit={(event) => {
            void handleSubmit(onSubmit)(event);
          }}
        >
          <Field error={formState.errors.email?.message} htmlFor="email" label="ایمیل">
            <Input dir="ltr" id="email" type="email" {...register("email")} />
          </Field>
          {isLogin ? null : (
            <Field error={formState.errors.fullName?.message} htmlFor="fullName" label="نام کامل">
              <Input id="fullName" {...register("fullName")} />
            </Field>
          )}
          <Field error={formState.errors.password?.message} htmlFor="password" label="رمز عبور">
            <Input dir="ltr" id="password" type="password" {...register("password")} />
          </Field>
          <Button disabled={pending} type="submit">
            {isLogin ? "ورود" : "ثبت‌نام"}
          </Button>
        </form>
      </CardContent>
    </Card>
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
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
