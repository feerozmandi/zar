import { Injectable, Logger, type OnModuleDestroy } from "@nestjs/common";
import { createPrismaClient, type PrismaClient } from "@xennic/database";

/**
 * تنها سازنده‌ی اتصال دیتابیس در بک‌اند.
 * ساخت کلاینت (و تزریق driver adapter مورد نیاز Prisma 7) در @xennic/database انجام می‌شود
 * تا تنظیمات اتصال در دو جا تکرار نشود.
 */
@Injectable()
export class PrismaService implements OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  public readonly client: PrismaClient = createPrismaClient();

  public async onModuleDestroy(): Promise<void> {
    try {
      await this.client.$disconnect();
    } catch (error) {
      this.logger.warn(`قطع اتصال دیتابیس با خطا روبرو شد: ${String(error)}`);
    }
  }

  /** بررسی آماده‌به‌کار بودن دیتابیس (استفاده‌شده در /health/ready) */
  public async ping(): Promise<boolean> {
    try {
      await this.client.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
