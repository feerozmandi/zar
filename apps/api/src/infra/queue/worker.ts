/**
 * پردازشگر مستقل صف‌ها (اجرا: pnpm --filter @xennic/api worker).
 * فاز ۱: اتصال و چرخه‌ی حیات پیاده شده است؛ بدنه‌ی پردازش OCR/AI در فاز ۲ کامل می‌شود.
 */
import { Worker } from "bullmq";
import { Redis } from "ioredis";
import { apiEnvSchema, formatEnvError, QUEUES } from "@xennic/shared";

const parsed = apiEnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error(`پیکربندی worker نامعتبر است:\n${formatEnvError(parsed.error)}`);
  process.exit(1);
}
const env = parsed.data;
const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

const workers = Object.values(QUEUES).map((queue) => {
  const worker = new Worker(
    queue,
    async (job) => {
      // فاز ۱: پردازش واقعی (OCR/AI/PDF) در فاز ۲ اضافه می‌شود؛ اینجا فقط شمارش می‌شود
      await connection.incr(`xennic:worker:${queue}:processed`);
      return { queue, jobId: job.id, status: "not-implemented" as const };
    },
    { connection, concurrency: env.BULLMQ_CONCURRENCY },
  );
  worker.on("failed", (job, error) => {
    console.error(`[worker] ${queue}/${job?.id ?? "?"} ناموفق:`, error.message);
  });
  return worker;
});

async function shutdown(): Promise<void> {
  await Promise.all(workers.map((worker) => worker.close()));
  await connection.quit();
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown());
process.on("SIGINT", () => void shutdown());
console.info(`[worker] صف‌ها فعال شد: ${Object.values(QUEUES).join(", ")}`);
