import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import globals from "globals";
import { monorepoIgnores } from "./ignores.mjs";

/**
 * پایه‌ی lint همه‌ی بسته‌های TypeScript پروژه.
 * @param {object} [options]
 * @param {string[]} [options.extraIgnores]
 * @param {Record<string, string>} [options.rules]
 * @param {string[]} [options.allowDefaultProject] فایل‌هایی که در tsconfig نیستند (کانفیگ‌ها)
 */
export function base({ extraIgnores = [], rules = {}, allowDefaultProject = ["*.mjs", "*.cjs"] } = {}) {
  return tseslint.config(
    { ignores: [...monorepoIgnores, ...extraIgnores] },
    js.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    {
      languageOptions: {
        globals: { ...globals.node },
        parserOptions: {
          // تحلیل نوع‌محور با پروژه‌ی tsconfig خود بسته؛ فایل‌های کانفیگ (که در
          // include نیستند) با «پروژه‌ی پیش‌فرض» بررسی می‌شوند تا خطای not found ندهد.
          projectService: { allowDefaultProject },
          tsconfigRootDir: process.cwd(),
        },
      },
      rules: {
        "no-console": ["warn", { allow: ["warn", "error", "info"] }],
        "@typescript-eslint/consistent-type-imports": [
          "error",
          { prefer: "type-imports", fixStyle: "separate-type-imports" },
        ],
        "@typescript-eslint/no-unused-vars": [
          "error",
          { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
        ],
        ...rules,
      },
    },
    // prettier باید آخرین عنصر باشد تا قواعد فرمت‌دهی را غیرفعال کند
    prettier,
  );
}

export { monorepoIgnores };
