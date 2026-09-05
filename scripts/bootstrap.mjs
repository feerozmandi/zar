#!/usr/bin/env node
/**
 * راه‌اندازی محیط توسعه‌ی مونورپوی Xennic.
 *   node scripts/bootstrap.mjs        (یا: pnpm setup)
 *
 * کارها:
 *  ۱) بررسی نسخه‌ی Node و pnpm
 *  ۲) ساخت .env از .env.example در صورت نبود
 *  ۳) تولید JWT_SECRET و ENCRYPTION_KEY (AES-256) و درج در .env
 *  ۴) ساخت فایل‌های .env بخش‌ها (apps/api، apps/web، apps/ocr) در صورت نبود
 */
import { randomBytes } from "node:crypto";
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const log = (message) => console.info(`\u2713 ${message}`);
const warn = (message) => console.info(`! ${message}`);

// ۱) پیش‌نیازها
const [major] = process.versions.node.split(".").map(Number);
if (major < 22) warn(`Node ${major} تشخیص داده شد؛ این پروژه Node 22+ می‌خواهد.`);

// ۲) .env ریشه
const rootEnv = path.join(root, ".env");
if (!existsSync(rootEnv)) {
  copyFileSync(path.join(root, ".env.example"), rootEnv);
  log("فایل .env از .env.example ساخته شد.");
}

// ۳) کلیدها
let env = readFileSync(rootEnv, "utf8");
const secret = randomBytes(48).toString("base64url");
const encryptionKey = randomBytes(32).toString("hex");

const needsSecret = /^JWT_SECRET=\s*$/mu.test(env);
env = env.replace(/^JWT_SECRET=\s*$/mu, `JWT_SECRET=${secret}`);
env = env.replace(/^ENCRYPTION_KEY=\s*$/mu, `ENCRYPTION_KEY=${encryptionKey}`);
if (needsSecret) log("JWT_SECRET و ENCRYPTION_KEY تصادفی تولید و در .env نوشته شد.");
writeFileSync(rootEnv, env, "utf8");
log("کلیدهای JWT/ENCRYPTION بررسی شد (در صورت خالی بودن، مقدار توسعه درج شد).");

// ۴) .env بخش‌ها
for (const app of ["apps/api", "apps/web", "apps/ocr"]) {
  const example = path.join(root, app, ".env.example");
  const target = path.join(root, app, ".env");
  if (existsSync(example) && !existsSync(target)) {
    copyFileSync(example, target);
    log(`${app}/.env ساخته شد.`);
  }
}

log("اقدام بعدی: pnpm install && pnpm db:generate && pnpm dev");
