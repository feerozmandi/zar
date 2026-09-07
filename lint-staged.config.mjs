/**
 * lint-staged — نوت ۵ §۲ (کیفیت کد روی فایل‌های stage‌شده)
 *
 * در ESLint 9 هر بسته‌ی مونورپو eslint.config.mjs خودش را دارد و تنظیمات به‌صورت
 * پلکانی (cascade) از ریشه ارث برده نمی‌شود؛ پس اجرای `eslint` روی فایل‌های apps/* و
 * packages/* از ریشه فقط هشدار «File ignored» می‌دهد. بنابراین فایل‌ها بر اساس بسته
 * گروه‌بندی می‌شوند و ESLint داخل همان بسته اجرا می‌شود (همان کاری که `pnpm lint`
 * با Turbo انجام می‌دهد). Prettier چون تنظیماتش متمرکز است، از ریشه اجرا می‌شود.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.dirname(fileURLToPath(import.meta.url));

/** مسیر بسته → نام بسته، برای اجرای ESLint با pnpm --filter */
const PACKAGES = {
  "apps/api": "@xennic/api",
  "apps/web": "@xennic/web",
  "packages/database": "@xennic/database",
  "packages/design-tokens": "@xennic/design-tokens",
  "packages/eslint-config": "@xennic/eslint-config",
  "packages/shared": "@xennic/shared",
  "packages/typescript-config": "@xennic/typescript-config",
  "packages/ui": "@xennic/ui",
};

/** فایل‌هایی که ESLint بررسی می‌کند (اسکریپت‌های JS ریشه با تنظیمات ریشه) */
const LINTABLE = /\.(?:ts|tsx|js|mjs|cjs)$/u;
/* --no-warn-ignored: فایل‌های ignore‌شده در بسته (مثل next-env.d.ts) خطا نسازند */
const ESLINT_FLAGS = "--fix --max-warnings=0 --no-warn-ignored";
/** فقط فرمت‌هایی که Prettier پارسر builtin دارد */
const PRETTIABLE = /\.(?:md|mdx|json|jsonc|css|ya?ml|html)$/u;

const quote = (file) => `'${file.replaceAll("'", `'"'"'`)}'`;

const relativeOf = (file) =>
  path
    .relative(repositoryRoot, path.isAbsolute(file) ? file : path.join(repositoryRoot, file))
    .split(path.sep)
    .join("/");

export default function groupTasks(files) {
  const byPackage = new Map();
  const rootLintable = [];
  const prettierFiles = [];

  for (const file of files) {
    const absolute = path.isAbsolute(file) ? file : path.join(repositoryRoot, file);
    const relative = relativeOf(file);
    if (LINTABLE.test(relative)) {
      const owner = Object.keys(PACKAGES).find((dir) => relative.startsWith(`${dir}/`));
      if (owner) byPackage.set(owner, [...(byPackage.get(owner) ?? []), absolute]);
      else rootLintable.push(absolute);
    }
    if (PRETTIABLE.test(relative)) prettierFiles.push(file);
  }

  const tasks = [];
  for (const [dir, name] of Object.entries(PACKAGES)) {
    const group = byPackage.get(dir);
    if (!group) continue;
    tasks.push(`pnpm --filter ${name} exec eslint ${group.map(quote).join(" ")} ${ESLINT_FLAGS}`);
  }
  if (rootLintable.length > 0) {
    tasks.push(`eslint ${rootLintable.map(quote).join(" ")} ${ESLINT_FLAGS}`);
  }
  if (prettierFiles.length > 0) {
    tasks.push(`prettier --write ${prettierFiles.map(quote).join(" ")}`);
  }
  return tasks;
}
