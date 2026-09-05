/**
 * @xennic/database — تنها دروازه‌ی دسترسی به دیتابیس در مونورپو.
 * بخش‌های دیگر نباید مستقیم `pg` یا PrismaClient را بسازند.
 */
export { createPrismaClient, disconnectPrisma, prisma } from "./client.js";
export type { PrismaClientOptions } from "./client.js";
export { dbEnv } from "./env.js";
export * from "./generated/prisma/client.js";
