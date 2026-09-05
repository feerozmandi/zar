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
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "coverage/**"]),
]);

export default eslintConfig;
