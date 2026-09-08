/**
 * پردازشگر مستقل صف‌ها (اجرا: pnpm --filter @xennic/api worker).
 *
 * صف ai.request به پردازشگر واقعی متصل است (generate و wiki-ask با ماندگاری AiJob).
 * بدنه‌ی پردازش OCR/PDF در فاز‌های بعدی کامل می‌شود.
 */
import { Worker, type Job } from "bullmq";
import { Redis } from "ioredis";
import { createPrismaClient, type PrismaClient } from "@xennic/database";
import { apiEnvSchema, formatEnvError, QUEUES } from "@xennic/shared";
import { processAiRequestJob, type AiWorkerContext } from "./processors/ai-request.processor.js";

const parsed = apiEnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error(`پیکربندی worker نامعتبر است:\n${formatEnvError(parsed.error)}`);
  process.exit(1);
}
const env = parsed.data;
const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
const prisma: PrismaClient = createPrismaClient(["error"]);

const aiContext: AiWorkerContext = {
  prisma,
  encryptionKeyHex: env.ENCRYPTION_KEY,
  githubModels: { baseUrl: env.GITHUB_MODELS_BASE_URL, token: env.GITHUB_MODELS_TOKEN },
};

/** پردازشگر هر صف؛ صف‌های بدون پیاده‌سازی فقط شمارش می‌شوند (فازهای بعد) */
async function processJob(queue: string, job: Job): Promise<unknown> {
  if (queue === QUEUES.aiRequest) {
    return processAiRequestJob(aiContext, job);
  }
  await connection.incr(`xennic:worker:${queue}:processed`);
  return { queue, jobId: job.id, status: "not-implemented" as const };
}

const workers = Object.values(QUEUES).map((queue) => {
  const worker = new Worker(queue, (job) => processJob(queue, job), {
    connection,
    concurrency: env.BULLMQ_CONCURRENCY,
  });
  worker.on("completed", (job) => {
    if (queue === QUEUES.aiRequest) console.info(`[worker] ${queue}/${job.id} انجام شد`);
  });
  worker.on("failed", (job, error) => {
    console.error(`[worker] ${queue}/${job?.id ?? "?"} ناموفق:`, error.message);
  });
  return worker;
});

async function shutdown(): Promise<void> {
  await Promise.all(workers.map((worker) => worker.close()));
  await prisma.$disconnect().catch(() => undefined);
  await connection.quit();
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown());
process.on("SIGINT", () => void shutdown());
console.info(`[worker] صف‌ها فعال شد: ${Object.values(QUEUES).join(", ")}`);
