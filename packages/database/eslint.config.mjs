import tseslint from "typescript-eslint";

import { node } from "@xennic/eslint-config/node";

export default tseslint.config(
  ...node({
    extraIgnores: ["dist/**", "src/generated/**", "scripts/**"],
    rules: {
      // seedها و کلاینت تولیدشده خواندن/نوشتن مستقیم env دارند
      "no-console": "off",
    },
  }),
  {
    // اسکریپت‌های توسعه (seed/CLI) روی delegateهای کلاینت تولیدی کار می‌کنند؛
    // تا زمانی که `pnpm db:generate` اجرا نشده باشد این انواع any می‌مانند،
    // پس قواعد «unsafe» برای همین فایل‌ها رها می‌شود (کد اجرایی نه، ابزار است).
    files: ["prisma/**/*.ts"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
    },
  },
);
