/**
 * Prisma ORM 7 — تمام تنظیمات CLI و اتصال در این فایل است.
 * در v7 دیگر `url` داخل schema.prisma مجاز نیست و متغیرهای محیطی به‌صورت
 * خودکار بارگذاری نمی‌شوند؛ بنابراین dotenv را صریحاً بارگذاری می‌کنیم.
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

const here = path.dirname(fileURLToPath(import.meta.url));

// .env محلی بسته و در غیر این صورت .env ریشه‌ی مخزن
for (const candidate of [path.join(here, ".env"), path.join(here, "../../.env")]) {
  if (existsSync(candidate)) dotenv.config({ path: candidate });
}

const url = process.env.DATABASE_URL ?? "postgresql://xennic:xennic@localhost:5432/xennic?schema=public";

export default defineConfig({
  schema: path.join(here, "prisma/schema.prisma"),
  migrations: {
    path: path.join(here, "prisma/migrations"),
    seed: "tsx prisma/seed.ts",
  },
  datasource: { url },
});
