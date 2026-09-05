import { webEnvSchema, formatEnvError } from "@xennic/shared";
import "server-only";

/**
 * اعتبارسنجی متغیرهای محیطی سمت وب با همان zodِ بک‌اند (بدون تکرار اسکیم).
 * فقط در Runtime سرور قابل خواندن است؛ کلید عمومی در NEXT_PUBLIC/* می‌آید.
 */
const parsed = webEnvSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  API_INTERNAL_URL: process.env.API_INTERNAL_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});

if (!parsed.success) {
  throw new Error(`پیکربندی apps/web نامعتبر است:\n${formatEnvError(parsed.error)}`);
}

export const webEnv = parsed.data;
export const siteUrl = webEnv.NEXT_PUBLIC_SITE_URL;
