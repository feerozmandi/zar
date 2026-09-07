import { z } from "zod";

/** قواعد مشترک ثبت‌نام/ورود — هم در سمت وب و هم در DTOهای Nest اعمال می‌شود */
export const passwordSchema = z
  .string()
  .min(10, "رمز عبور باید حداقل ۱۰ نویسه باشد")
  .regex(/[A-Za-z]/, "حداقل یک نویسه‌ی لاتین")
  .regex(/[0-9]/, "حداقل یک رقم");

export const registerSchema = z.object({
  email: z.email("ایمیل نامعتبر است"),
  nationalId: z
    .string()
    .regex(/^\d{10}$/, "کد ملی باید ۱۰ رقم باشد")
    .optional(),
  fullName: z.string().min(3, "نام کامل را وارد کنید"),
  company: z.string().min(2).optional(),
  phone: z
    .string()
    .regex(/^09\d{9}$/, "شماره همراه نامعتبر است")
    .optional(),
  password: passwordSchema,
  role: z.enum(["USER", "PRO_ENGINEER", "EPC_PARTNER"]).default("USER"),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1, "رمز عبور را وارد کنید"),
});

export const aiKeySchema = z.object({
  /** مقادیر دقیقاً با enum دیتابیس (AiProvider) یکسان‌اند تا نگاشت دستی لازم نشود */
  provider: z.enum(["GITHUB_MODELS", "OPENAI", "ANTHROPIC", "GEMINI"]),
  apiKey: z.string().min(12, "کلید API بیش از کوتاه است"),
  label: z.string().min(2).max(60).optional(),
  defaultModel: z.string().min(1).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AiKeyInput = z.infer<typeof aiKeySchema>;
