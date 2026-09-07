/** بارگذاری و اعتبارسنجی متغیرهای محیطی لایه‌ی داده (zod — همان کتابخانه‌ی کل مونورپو) */
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { databaseEnvSchema, formatEnvError } from "@xennic/shared";

const here = path.dirname(fileURLToPath(import.meta.url));

for (const candidate of [path.join(here, "../../../.env"), path.join(here, "../../.env")]) {
  if (existsSync(candidate)) dotenv.config({ path: candidate });
}

const parsed = databaseEnvSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  LOG_LEVEL: process.env.LOG_LEVEL,
  DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://xennic:xennic@localhost:5432/xennic?schema=public",
});

if (!parsed.success) {
  throw new Error(`متغیرهای محیطی نادرست‌اند:\n${formatEnvError(parsed.error)}`);
}

export const dbEnv = parsed.data;
