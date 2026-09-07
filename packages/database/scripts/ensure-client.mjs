#!/usr/bin/env node
/**
 * `prisma generate` را طرز اجرا می‌کند که بیلد تکرا‌پذیر بماند:
 *  • اگر کلاینت تولید نشده باشد → تولید الزامی است (خطا در دسترس نبودن شبکه، شکست می‌دهد).
 *  • اگر کلاینت موجود باشد و generate به هر دلیلی (مثلاً نبود شبکه برای دانلود engine)
 *    شکست بخورد → با هشدار ادامه می‌دهیم تا بیلد incremental نشکند.
 * در CI (کلون تازه) همیشه مسیر اول اجرا می‌شود، پس تولید واقعی تضمین می‌ماند.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const pkgRoot = path.resolve(import.meta.dirname, "..");
const clientFile = path.join(pkgRoot, "src/generated/prisma/client.ts");

const result = spawnSync("npx", ["--no-install", "prisma", "generate", "--no-hints"], {
  cwd: pkgRoot,
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (result.status === 0) process.exit(0);

if (existsSync(clientFile)) {
  console.warn(
    "! prisma generate ناموفق بود؛ کلاینتِ تولیدشده‌ی قبلی استفاده می‌شود. " +
      "برای اطمینان از همگامی با schema.prisma، پس از دسترسی به شبکه `pnpm db:generate` را اجرا کنید.",
  );
  process.exit(0);
}

console.error("! کلاینت Prisma هنوز تولید نشده و `prisma generate` هم شکست خورد؛ بیلد متوقف می‌شود.");
process.exit(result.status ?? 1);
