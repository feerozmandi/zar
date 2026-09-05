// پیکربندی lint برای فایل‌های ریشه (اسکریپت‌ها و کانفیگ‌ها).
// هر بسته‌ی workspace eslint.config.mjs خودش را دارد و از @xennic/eslint-config ارث می‌برد.
import js from "@eslint/js";
import globals from "globals";
import prettier from "eslint-config-prettier";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/coverage/**",
      "**/.turbo/**",
      "**/src/generated/**",
      "docs/**",
      "apps/ocr/**",
    ],
  },
  js.configs.recommended,
  {
    files: ["**/*.{mjs,cjs,js}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.node },
    },
    rules: { "no-console": "off" },
  },
  prettier,
];
