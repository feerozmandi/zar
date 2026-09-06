// خود-آرایی‌ی پکیج کانفیگ: فایل‌های .mjs آن با قوانین عمومی ریشه بررسی می‌شوند.
import js from "@eslint/js";
import globals from "globals";
import prettier from "eslint-config-prettier";

export default [
  { ignores: ["node_modules", "dist", "coverage"] },
  js.configs.recommended,
  {
    languageOptions: { ecmaVersion: "latest", sourceType: "module", globals: { ...globals.node } },
    rules: { "no-console": ["warn", { allow: ["warn", "error", "info"] }] },
  },
  prettier,
];
