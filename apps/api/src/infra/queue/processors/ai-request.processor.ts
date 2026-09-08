/**
 * پردازشگر صف ai.request — فاز ۲/۴ (نوت ۵: «پردازش‌های سنگین از صف عبور می‌کنند»).
 *
 * دو نوع کار پردازش می‌شود:
 *  • generate  — درخواست ناهم‌زمان POST /ai/generate (async: true)
 *  • wiki-ask  — پرسش‌وپاسخ دانشنامه POST /wiki/ask-ai (زمینه‌سازی با مقالات)
 *
 * چرخه‌ی حیات هر کار در جدول ai_jobs ماندگار می‌شود:
 *  QUEUED → RUNNING → SUCCEEDED | FAILED
 * تا GET /ai/jobs/:id همیشه نتیجه را داشته باشد حتی وقتی سابقه‌ی BullMQ پاک شده.
 */
import type { Job } from "bullmq";
import type { PrismaClient } from "@xennic/database";
import type { AiGenerateInput, AiTier, WikiAskJobPayload } from "@xennic/shared";
import { aesGcmDecrypt, keyFromHex } from "../../../common/crypto/aes-gcm.js";
import {
  AiProviderError,
  callProvider,
  PROVIDER_BASE_URL,
  PROVIDER_DEFAULT_MODEL,
  type AiProviderName,
} from "../../../modules/ai/ai-gateway.js";

export interface AiWorkerContext {
  prisma: PrismaClient;
  encryptionKeyHex: string;
  githubModels: { baseUrl: string; token?: string };
  /** سقف نویسه‌ی زمینه‌ی مقالات wiki تا پرامپت از حد مدل بزرگ‌تر نشود */
  wikiContextCharLimit?: number;
}

interface GenerateJobData extends AiGenerateInput {
  aiJobId?: string;
  userId: string;
}

interface WikiAskJobData extends WikiAskJobPayload {
  aiJobId?: string;
  userId: string;
}

interface ResolvedTarget {
  provider: AiProviderName;
  baseUrl: string;
  apiKey: string;
  tier: AiTier;
  credentialId?: string;
}

const WIKI_SYSTEM_PROMPT = [
  "تو دستیار تخصصی دانشنامه‌ی مهندسی برق پلتفرم Xennic هستی.",
  "فقط بر اساس زمینه‌ی ارائه‌شده (مقررات ملی ساختمان، نشریه ۱۱۰، آیین‌نامه‌های توانیر و استانداردهای IEC) پاسخ بده.",
  "اگر پاسخ در زمینه نبود، صادقانه بگو که در منابع ارائه‌شده یافت نشد.",
  "پاسخ را فارسی، دقیق و با ارجاع به شماره‌ی بند/ماده در صورت وجود بنویس.",
].join(" ");

/** انتخاب هدف فراخوان: BYOK کاربر (در صورت درخواست) وگرنه سطح SYSTEM */
async function resolveTarget(
  ctx: AiWorkerContext,
  userId: string,
  useOwnKey: boolean,
): Promise<ResolvedTarget> {
  if (useOwnKey) {
    const credential = await ctx.prisma.aiProviderCredential.findFirst({
      where: { userId, isActive: true },
      orderBy: { createdAt: "desc" },
    });
    if (!credential) throw new Error("کلید اختصاصی (BYOK) ثبت نشده است");

    const apiKey = aesGcmDecrypt(keyFromHex(ctx.encryptionKeyHex), {
      ciphertext: credential.encryptedKey,
      iv: credential.iv,
      authTag: credential.authTag,
    });
    const baseUrl =
      credential.provider === "GITHUB_MODELS"
        ? ctx.githubModels.baseUrl
        : PROVIDER_BASE_URL[credential.provider];

    await ctx.prisma.aiProviderCredential.update({
      where: { id: credential.id },
      data: { lastUsedAt: new Date() },
    });
    return { provider: credential.provider, baseUrl, apiKey, tier: "BYOK", credentialId: credential.id };
  }

  if (!ctx.githubModels.token) {
    throw new Error("GITHUB_MODELS_TOKEN تنظیم نشده است؛ پردازش سطح SYSTEM ممکن نیست");
  }
  return {
    provider: "GITHUB_MODELS",
    baseUrl: ctx.githubModels.baseUrl,
    apiKey: ctx.githubModels.token,
    tier: "SYSTEM",
  };
}

/** ساخت زمینه‌ی متنی از مقالات انتخابی دانشنامه (retrieval ساده‌ی فاز ۴) */
export async function buildWikiContext(
  prisma: PrismaClient,
  articleIds: string[],
  charLimit = 24_000,
): Promise<string> {
  if (articleIds.length === 0) return "";
  const articles = await prisma.wikiArticle.findMany({
    where: { id: { in: articleIds }, status: "PUBLISHED" },
    select: { title: true, source: true, contentMdx: true },
  });

  let used = 0;
  const chunks: string[] = [];
  for (const article of articles) {
    const header = `### ${article.title} (${article.source})`;
    const budget = charLimit - used - header.length - 2;
    if (budget <= 0) break;
    const body = article.contentMdx.length > budget ? `${article.contentMdx.slice(0, budget)}…` : article.contentMdx;
    chunks.push(`${header}\n${body}`);
    used += header.length + body.length + 2;
  }
  return chunks.join("\n\n");
}

async function markRunning(ctx: AiWorkerContext, aiJobId: string | undefined): Promise<void> {
  if (!aiJobId) return;
  await ctx.prisma.aiJob.update({
    where: { id: aiJobId },
    data: { status: "RUNNING", startedAt: new Date() },
  });
}

async function markResult(
  ctx: AiWorkerContext,
  aiJobId: string | undefined,
  target: ResolvedTarget | null,
  outcome:
    | { ok: true; model: string; content: string; promptTokens: number; completionTokens: number; latencyMs: number }
    | { ok: false; model?: string; errorMessage: string; latencyMs: number },
): Promise<void> {
  if (!aiJobId) return;
  await ctx.prisma.aiJob.update({
    where: { id: aiJobId },
    data: outcome.ok
      ? {
          status: "SUCCEEDED",
          provider: target?.provider ?? null,
          tier: target?.tier ?? "SYSTEM",
          model: outcome.model,
          resultText: outcome.content,
          promptTokens: outcome.promptTokens,
          completionTokens: outcome.completionTokens,
          latencyMs: outcome.latencyMs,
          errorMessage: null,
          finishedAt: new Date(),
        }
      : {
          status: "FAILED",
          provider: target?.provider ?? null,
          tier: target?.tier ?? "SYSTEM",
          model: outcome.model ?? null,
          errorMessage: outcome.errorMessage.slice(0, 500),
          latencyMs: outcome.latencyMs,
          finishedAt: new Date(),
        },
  });
}

async function logRequest(
  ctx: AiWorkerContext,
  userId: string,
  target: ResolvedTarget | null,
  model: string,
  purpose: string,
  status: number,
  latencyMs: number,
  errorMessage: string | null,
  usage?: { promptTokens: number; completionTokens: number },
): Promise<void> {
  try {
    await ctx.prisma.aiRequestLog.create({
      data: {
        userId,
        credentialId: target?.credentialId ?? null,
        tier: target?.tier ?? "SYSTEM",
        provider: target?.provider ?? "GITHUB_MODELS",
        model,
        purpose,
        status:
          status > 0 && status < 400 ? "OK" : status === 408 ? "TIMEOUT" : status === 429 ? "RATE_LIMITED" : "ERROR",
        promptTokens: usage?.promptTokens ?? 0,
        completionTokens: usage?.completionTokens ?? 0,
        latencyMs,
        errorMessage: errorMessage ? errorMessage.slice(0, 500) : null,
      },
    });
  } catch {
    // شکست لاگ نباید پردازش صف را از کار بیندازد
  }
}

/** پردازش کار generate (درخواست ناهم‌زمان POST /ai/generate) */
export async function processGenerateJob(
  ctx: AiWorkerContext,
  data: GenerateJobData,
): Promise<{ aiJobId?: string; model: string; ok: boolean }> {
  const { aiJobId, userId, ...input } = data;
  await markRunning(ctx, aiJobId);

  let target: ResolvedTarget | null = null;
  const started = Date.now();
  try {
    target = await resolveTarget(ctx, userId, input.useOwnKey ?? false);
    const model = input.model ?? PROVIDER_DEFAULT_MODEL[target.provider];
    const reply = await callProvider(target, { ...input, model });
    await markResult(ctx, aiJobId, target, {
      ok: true,
      model,
      content: reply.content,
      promptTokens: reply.promptTokens,
      completionTokens: reply.completionTokens,
      latencyMs: reply.latencyMs,
    });
    await logRequest(ctx, userId, target, model, "worker.generate", reply.status, reply.latencyMs, null, {
      promptTokens: reply.promptTokens,
      completionTokens: reply.completionTokens,
    });
    return { aiJobId, model, ok: true };
  } catch (error) {
    const latencyMs = error instanceof AiProviderError ? error.latencyMs : Date.now() - started;
    const status = error instanceof AiProviderError ? error.status : 0;
    const message = error instanceof Error ? error.message : String(error);
    const model = input.model ?? (target ? PROVIDER_DEFAULT_MODEL[target.provider] : "unknown");
    await markResult(ctx, aiJobId, target, { ok: false, model, errorMessage: message, latencyMs });
    await logRequest(ctx, userId, target, model, "worker.generate", status, latencyMs, message);
    throw error; // BullMQ باید شکست را ثبت کند (retry/backoff طبق تنظیمات صف)
  }
}

/** پردازش کار wiki-ask (پرسش‌وپاسخ دانشنامه با زمینه‌ی مقالات) */
export async function processWikiAskJob(
  ctx: AiWorkerContext,
  data: WikiAskJobData,
): Promise<{ aiJobId?: string; model: string; ok: boolean }> {
  const { aiJobId, userId, question, articleIds, model, temperature } = data;
  await markRunning(ctx, aiJobId);

  let target: ResolvedTarget | null = null;
  const started = Date.now();
  try {
    target = await resolveTarget(ctx, userId, false);
    const context = await buildWikiContext(ctx.prisma, articleIds ?? [], ctx.wikiContextCharLimit);
    const resolvedModel = model ?? PROVIDER_DEFAULT_MODEL[target.provider];

    const prompt = context
      ? `زمینه (مقالات دانشنامه):\n${context}\n\nپرسش کاربر:\n${question}`
      : `پرسش کاربر:\n${question}`;

    const reply = await callProvider(target, {
      prompt,
      model: resolvedModel,
      system: WIKI_SYSTEM_PROMPT,
      temperature: temperature ?? 0.2,
      maxTokens: 2048,
      useOwnKey: false,
    });

    await markResult(ctx, aiJobId, target, {
      ok: true,
      model: resolvedModel,
      content: reply.content,
      promptTokens: reply.promptTokens,
      completionTokens: reply.completionTokens,
      latencyMs: reply.latencyMs,
    });
    await logRequest(ctx, userId, target, resolvedModel, "worker.wiki-ask", reply.status, reply.latencyMs, null, {
      promptTokens: reply.promptTokens,
      completionTokens: reply.completionTokens,
    });
    return { aiJobId, model: resolvedModel, ok: true };
  } catch (error) {
    const latencyMs = error instanceof AiProviderError ? error.latencyMs : Date.now() - started;
    const status = error instanceof AiProviderError ? error.status : 0;
    const message = error instanceof Error ? error.message : String(error);
    const resolvedModel = model ?? (target ? PROVIDER_DEFAULT_MODEL[target.provider] : "unknown");
    await markResult(ctx, aiJobId, target, { ok: false, model: resolvedModel, errorMessage: message, latencyMs });
    await logRequest(ctx, userId, target, resolvedModel, "worker.wiki-ask", status, latencyMs, message);
    throw error;
  }
}

/** نقطه‌ی ورود واحد صف ai.request — نگاشت نام کار به پردازشگر */
export async function processAiRequestJob(ctx: AiWorkerContext, job: Job): Promise<unknown> {
  switch (job.name) {
    case "generate":
      return processGenerateJob(ctx, job.data as GenerateJobData);
    case "wiki-ask":
      return processWikiAskJob(ctx, job.data as WikiAskJobData);
    default:
      // کارهای ناشناخته شکست نرم می‌خورند تا صف مسدود نشود
      return { status: "skipped" as const, reason: `کار ناشناخته: ${job.name}` };
  }
}
