/**
 * الگوهای مشترک «رد شدن» برای تمام بسته‌های مونورپو.
 * خروجی‌های بیلد، فایل‌های تولیدشده و پوشه‌های ابزار اینجا متمرکز هستند تا
 * هر بخش مجزا نسخه‌ی خودش از ignoreها را نگه ندارد.
 */
export const monorepoIgnores = [
  "**/node_modules/**",
  "**/dist/**",
  "**/build/**",
  "**/coverage/**",
  "**/.next/**",
  "**/.turbo/**",
  "**/.cache/**",
  "**/src/generated/**",
  "**/next-env.d.ts",
  "**/*.tsbuildinfo",
  "docs/**",
  "**/*.md",
];
