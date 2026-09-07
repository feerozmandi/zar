import { BullModule } from "@nestjs/bullmq";
import { Global, Module } from "@nestjs/common";
import { QUEUES } from "@xennic/shared";
import { Redis } from "ioredis";
import { AppConfigService } from "../../config/app-config.service.js";

export const XENNIC_QUEUES = Object.values(QUEUES);

/**
 * صف پردازش‌های سنگین (OCR، تحلیل AI، صدور PDF) — نوت ۳ §۲-الف و نوت ۵ §۱.
 * اتصال Redis از AppConfigService خوانده می‌شود تا آدرس صف در دو جا تعریف نشود.
 */
@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => {
        const connection = new Redis(config.redisUrl, {
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
        });
        return { connection };
      },
    }),
    BullModule.registerQueue(
      ...XENNIC_QUEUES.map((name) => ({
        name,
        options: {
          removeOnComplete: { age: 3600, count: 1000 },
          removeOnFail: { age: 24 * 3600 },
        },
      })),
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}
