/**
 * فایل ESLint خالی کنار کلاینت تولیدشده می‌گذارد تا در `pnpm lint`
 * خارج از پروژه‌ی TypeScript تلقی نشود.
 */
import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const generated = path.join(root, "src/generated/prisma");
if (existsSync(generated)) {
  writeFileSync(path.join(root, "src/generated/.eslintignore"), "*\n", "utf8");
}
