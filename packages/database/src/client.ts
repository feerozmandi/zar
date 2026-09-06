/**
 * کارخانه‌ی ساخت PrismaClient برای Prisma ORM 7.
 * در v۷ موتور داخلی حذف شده و تزریق driver adapter الزامی است؛ پس هر مصرف‌کننده
 * (API، سکریپت‌ها، تست‌ها) از همین یک نقطه کلاینت می‌گیرد تا تنظیمات یکسان بماند.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";
import { dbEnv } from "./env.js";

export type PrismaClientOptions = ConstructorParameters<typeof PrismaClient>[0];

function createAdapter() {
  return new PrismaPg({
    connectionString: dbEnv.DATABASE_URL,
    max: Number(process.env.DB_POOL_MAX ?? 10),
    idleTimeoutMillis: 30_000,
  });
}

export function createPrismaClient(log?: ("query" | "info" | "warn" | "error")[]): PrismaClient {
  return new PrismaClient({
    adapter: createAdapter(),
    log: dbEnv.NODE_ENV === "development" ? (log ?? ["warn", "error"]) : (log ?? ["error"]),
  });
}

/** نمونه‌ی سینگلتون برای محیط توسعه (جلوگیری از اتصال اضافه در hot-reload) */
const globalForPrisma = globalThis as unknown as { xennicPrisma?: PrismaClient };

export const prisma: PrismaClient = globalForPrisma.xennicPrisma ?? createPrismaClient();

if (dbEnv.NODE_ENV !== "production") globalForPrisma.xennicPrisma = prisma;

export async function disconnectPrisma(client: PrismaClient = prisma): Promise<void> {
  await client.$disconnect();
}
