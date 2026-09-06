import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { react } from "@xennic/eslint-config/react";

/**
 * ترکیب قواعد مشترک مونورپو با قوانین Next.js (core-web-vitals + TS).
 * ترتیب اهمیت دارد: قواعد مشترک اول، سپس next، و در پایان ignores.
 */
const eslintConfig = defineConfig([
  ...react(),
  ...nextVitals,
  ...nextTs,
  {
    // مرز باندل: منطق مخصوص Node (scrypt روی node:crypto) نباید در کلاینت ظاهر شود؛
    // ریشه‌ی همین خطا در نوت ۵ §۲ بود: «"original" argument must be of type Function»
    // چون packages/shared/src/security از barrel بیرون کشیده می‌شد (مرجع: packages/shared/src/index.ts).
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@xennic/shared/security",
              message:
                "هش گذرواژه فقط در apps/api و prisma/seed مجاز است؛ مرورگر به node:crypto دسترسی ندارد.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "coverage/**"]),
]);

export default eslintConfig;
