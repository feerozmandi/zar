import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import type { Queue as BullQueue } from "bullmq";
import { QUEUES } from "@xennic/shared";

/**
 * پایش صف‌ها: سلامت اتصال Redis و عمق صف‌ها.
 * صف مرجع برای بررسی اتصال، صف OCR است (سنگین‌ترین مسیر پلتفرم).
 */
@Injectable()
export class QueueService {
  public constructor(@InjectQueue(QUEUES.billOcr) private readonly ocrQueue: BullQueue) {}

  public async indicator(): Promise<{ redis: { status: "up" | "down"; waiting?: number; failed?: number } }> {
    try {
      await this.ocrQueue.waitUntilReady();
      const [waiting, failed] = await Promise.all([
        this.ocrQueue.getWaitingCount(),
        this.ocrQueue.getFailedCount(),
      ]);
      return { redis: { status: "up", waiting, failed } };
    } catch {
      return { redis: { status: "down" } };
    }
  }
}
