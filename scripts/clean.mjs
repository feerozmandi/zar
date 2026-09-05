#!/usr/bin/env node
/** پاک‌سازی خروجی‌های بیلد و کش در کل مونورپو (node scripts/clean.mjs) */
import { rmSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const targets = [
  "apps/web/.next",
  "apps/web/coverage",
  "apps/api/dist",
  "apps/api/coverage",
  "apps/ocr/.venv",
  "packages/shared/dist",
  "packages/ui/dist",
  "packages/database/dist",
  "packages/design-tokens/dist",
  "packages/database/src/generated",
  ".turbo",
];

for (const target of targets) {
  rmSync(path.join(root, target), { recursive: true, force: true });
  console.info(`✓ پاک شد: ${target}`);
}
