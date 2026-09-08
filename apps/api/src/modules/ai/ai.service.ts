import type { Queue as BullQueue } from "bullmq";
import { InjectQueue } from "@nestjs/bullmq";
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import {
  DEFAULT_AI_MODELS,
  QUEUES,
  type AiCompareEntry,
  type AiCompareInput,
  type AiCompareResult,
  type AiGenerateInput,
  type AiGenerateResult,
  type AiJobEnqueued,
  type AiModelRow,
  type AiTier,
} from "@xennic/shared";
import { CryptoService } from "../../common/crypto/crypto.service.js";
import { AppConfigService } from "../../config/app-config.service.js";
import { PrismaService } from "../../infra/prisma/prisma.service.js";
import {
  AiProviderError,
  callProvider,
  PROVIDER_BASE_URL,
  PROVIDER_DEFAULT_MODEL,
  type AiProviderName,
  type GatewayCallTarget,
} from "./ai-gateway.js";

// نوع ورودی از @xennic/shared می‌آید (اسکیمای aiGenerateSchema) تا قرارداد API در دو جا تعریف نشود

interface ResolvedTarget extends Partial<GatewayCallTarget> {
  provider: AiProviderName;
  baseUrl: string;
  apiKey?: string;
  tier: AiTier;
  credentialId?: string;
}

/**
 * Multi-Model AI Gateway (نوت ۳ §۲-ج):
 *  • SYSTEM: اتصال رایگان از طریق GitHub Models
 *  • BYOK  : کلید رمزنگاری‌شده‌ی خود کاربر (فقط لحظه‌ی فراخوان رمزگشایی می‌شود)
 *
 * قرارداد HTTP ارائه‌دهنده‌ها در ai-gateway.ts است تا worker صف نیز از همان استفاده کند.
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  public constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly crypto: CryptoService,
    @InjectQueue(QUEUES.aiRequest) private readonly aiQueue: BullQueue,
  ) {}

  /** GET /ai/models */
  public async models(): Promise<AiModelRow[]> {
    const rows = await this.prisma.client.aiModelCatalog.findMany({
      where: { isActive: true },
      select: {
        slug: true,
        displayName: true,
        provider: true,
        supportsVision: true,
        freeTierOnly: true,
        maxTokens: true,
      },
      orderBy: { displayName: "asc" },
    });
    // در فاز ۱ که catalog هنوز پر نشده، فهرست پیش‌فرض سند نوت ۳ برگردانده می‌شود
    return rows.length > 0
      ? rows
      : DEFAULT_AI_MODELS.map((slug) => ({
          slug,
          displayName: slug,
          provider: "GITHUB_MODELS" as const,
          supportsVision: false,
          freeTierOnly: true,
        }));
  }

  /** POST /ai/generate */
  public async generate(userId: string, input: AiGenerateInput): Promise<AiGenerateResult> {
    const target = await this.resolveTarget(userId, input.useOwnKey);
    const model = input.model ?? PROVIDER_DEFAULT_MODEL[target.provider];

    try {
      const result = await callProvider(
        { provider: target.provider, baseUrl: target.baseUrl, apiKey: target.apiKey ?? "" },
        input,
      );
      await this.logCall(userId, target, model, "api.generate", result.status, result.latencyMs, null, {
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
      });
      return {
        model: result.model,
        tier: target.tier,
        content: result.content,
        usage: { promptTokens: result.promptTokens, completionTokens: result.completionTokens },
      };
    } catch (error) {
      if (error instanceof AiProviderError) {
        this.logger.error(`فراخوان AI ناموفق (${error.status}) برای ${target.provider}`);
        await this.logCall(userId, target, model, "api.generate", error.status, error.latencyMs, error.message);
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  /**
   * POST /ai/compare — هسته‌ی AI Arena (نوت ۵ — گام چهارم):
   * یک پرامپت به چند مدل هم‌زمان ارسال و نتایج کنار هم برگردانده می‌شود.
   * خطای یک مدل، پاسخ مدل‌های دیگر را از بین نمی‌برد.
   */
  public async compare(userId: string, input: AiCompareInput): Promise<AiCompareResult> {
    const uniqueModels = [...new Set(input.models)];
    const target = await this.resolveTarget(userId, input.useOwnKey);
    const catalog = await this.prisma.client.aiModelCatalog.findMany({
      where: { slug: { in: uniqueModels }, isActive: true },
      select: { slug: true, provider: true },
    });

    const results = await Promise.all(
      uniqueModels.map(async (model): Promise<AiCompareEntry> => {
        // در حالت SYSTEM همه از GitHub Models عبور می‌کنند؛ در BYOK ارائه‌دهنده‌ی کلید کاربر ملاک است
        const generateInput: AiGenerateInput = {
          prompt: input.prompt,
          model,
          system: input.system,
          maxTokens: input.maxTokens,
          temperature: input.temperature,
          useOwnKey: input.useOwnKey,
        };
        try {
          const reply = await callProvider(
            { provider: target.provider, baseUrl: target.baseUrl, apiKey: target.apiKey ?? "" },
            generateInput,
          );
          await this.logCall(userId, target, model, "api.compare", reply.status, reply.latencyMs, null, {
            promptTokens: reply.promptTokens,
            completionTokens: reply.completionTokens,
          });
          return {
            model,
            ok: true,
            content: reply.content,
            latencyMs: reply.latencyMs,
            usage: { promptTokens: reply.promptTokens, completionTokens: reply.completionTokens },
          };
        } catch (error) {
          const message = error instanceof AiProviderError ? error.message : String(error);
          const status = error instanceof AiProviderError ? error.status : 0;
          const latencyMs = error instanceof AiProviderError ? error.latencyMs : 0;
          await this.logCall(userId, target, model, "api.compare", status, latencyMs, message);
          return { model, ok: false, errorMessage: message, latencyMs };
        }
      }),
    );

    // مدل‌هایی که در کاتالوگ نیستند هشدار نرم می‌گیرند (بدون شکست کل درخواست)
    const known = new Set(catalog.map((row) => row.slug));
    for (const entry of results) {
      if (entry.ok || known.size === 0) continue;
      if (!known.has(entry.model) && entry.errorMessage) {
        entry.errorMessage = `${entry.errorMessage} (مدل در کاتالوگ فعال یافت نشد)`;
      }
    }

    return { tier: target.tier, results };
  }

  /**
   * ارجاع درخواست‌های سنگین به صف (نوت ۵ §۱).
   * رکورد AiJob در Postgres ماندگار می‌شود تا GET /ai/jobs/:id پس از پاک شدن
   * سابقه‌ی BullMQ (removeOnComplete) هم نتیجه را برگرداند.
   */
  public async enqueue(userId: string, input: AiGenerateInput): Promise<AiJobEnqueued> {
    const job = await this.prisma.client.aiJob.create({
      data: {
        userId,
        purpose: "api.generate",
        tier: input.useOwnKey ? "BYOK" : "SYSTEM",
        model: input.model ?? null,
        inputJson: {
          prompt: input.prompt,
          model: input.model,
          system: input.system,
          maxTokens: input.maxTokens,
          temperature: input.temperature,
          useOwnKey: input.useOwnKey,
        },
      },
      select: { id: true },
    });
    await this.aiQueue.add("generate", { aiJobId: job.id, userId, ...input }, { jobId: job.id });
    return { jobId: job.id, status: "QUEUED" as const };
  }

  /** GET /ai/jobs/:id — وضعیت/نتیجه‌ی کار ناهم‌زمان (فقط برای صاحب آن) */
  public async job(userId: string, id: string) {
    const job = await this.prisma.client.aiJob.findFirst({
      where: { id, userId },
      select: {
        id: true,
        purpose: true,
        status: true,
        tier: true,
        provider: true,
        model: true,
        resultText: true,
        promptTokens: true,
        completionTokens: true,
        latencyMs: true,
        errorMessage: true,
        createdAt: true,
        finishedAt: true,
      },
    });
    if (!job) throw new NotFoundException("کار موردنظر یافت نشد");
    return {
      ...job,
      createdAt: job.createdAt.toISOString(),
      finishedAt: job.finishedAt?.toISOString() ?? null,
    };
  }

  /** GET /ai/jobs — تاریخچه‌ی کارهای کاربر (صفحه‌بندی‌شده) */
  public async jobs(userId: string, page: number, pageSize: number) {
    const [items, total] = await this.prisma.client.$transaction([
      this.prisma.client.aiJob.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          purpose: true,
          status: true,
          tier: true,
          provider: true,
          model: true,
          resultText: true,
          promptTokens: true,
          completionTokens: true,
          latencyMs: true,
          errorMessage: true,
          createdAt: true,
          finishedAt: true,
        },
      }),
      this.prisma.client.aiJob.count({ where: { userId } }),
    ]);
    return {
      items: items.map((job) => ({
        ...job,
        createdAt: job.createdAt.toISOString(),
        finishedAt: job.finishedAt?.toISOString() ?? null,
      })),
      meta: { page, pageSize, total },
    };
  }

  private async resolveTarget(userId: string, useOwnKey: boolean): Promise<ResolvedTarget> {
    const github = this.config.githubModels;

    if (!useOwnKey) {
      if (!github.token) {
        throw new ServiceUnavailableException(
          "برای سطح SYSTEM باید GITHUB_MODELS_TOKEN تنظیم شود؛ یا کلید اختصاصی خود را در /user/ai-settings ثبت کنید",
        );
      }
      return {
        baseUrl: github.baseUrl,
        apiKey: github.token,
        provider: "GITHUB_MODELS",
        tier: "SYSTEM" as AiTier,
      };
    }

    const credential = await this.prisma.client.aiProviderCredential.findFirst({
      where: { userId, isActive: true },
      orderBy: { createdAt: "desc" },
    });
    if (!credential) throw new BadRequestException("کلید اختصاصی (BYOK) ثبت نشده است");

    const apiKey = this.crypto.decrypt({
      ciphertext: credential.encryptedKey,
      iv: credential.iv,
      authTag: credential.authTag,
    });
    // هر ارائه‌دهنده آدرس و فرمت درخواست خودش را دارد؛ فقط نشناختن این تفاوت
    // باعث می‌شد کلید Anthropic/Gemini به سرور GitHub Models ارسال شود.
    const baseUrl =
      credential.provider === "GITHUB_MODELS" ? github.baseUrl : PROVIDER_BASE_URL[credential.provider];

    await this.prisma.client.aiProviderCredential.update({
      where: { id: credential.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      baseUrl,
      apiKey,
      provider: credential.provider,
      tier: "BYOK" as AiTier,
      credentialId: credential.id,
    };
  }

  private async logCall(
    userId: string,
    target: ResolvedTarget,
    model: string,
    purpose: "api.generate" | "api.compare",
    status: number,
    latencyMs: number,
    errorMessage: string | null,
    usage?: { promptTokens: number; completionTokens: number },
  ): Promise<void> {
    try {
      await this.prisma.client.aiRequestLog.create({
        data: {
          userId,
          credentialId: target.credentialId ?? null,
          tier: target.tier,
          provider: target.provider,
          model,
          purpose,
          status: status > 0 && status < 400 ? "OK" : status === 408 ? "TIMEOUT" : status === 429 ? "RATE_LIMITED" : "ERROR",
          promptTokens: usage?.promptTokens ?? 0,
          completionTokens: usage?.completionTokens ?? 0,
          latencyMs,
          errorMessage: errorMessage ? errorMessage.slice(0, 500) : null,
        },
      });
    } catch (error) {
      // شکست لاگ نباید پاسخ کاربر را خراب کند
      this.logger.warn(`ثبت AiRequestLog ناموفق: ${String(error)}`);
    }
  }
}
