import type { Queue as BullQueue } from "bullmq";
import { InjectQueue } from "@nestjs/bullmq";
import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import {
  DEFAULT_AI_MODELS,
  QUEUES,
  type AiGenerateInput,
  type AiModelRow,
  type AiTier,
} from "@xennic/shared";
import { CryptoService } from "../../common/crypto/crypto.service.js";
import { AppConfigService } from "../../config/app-config.service.js";
import { PrismaService } from "../../infra/prisma/prisma.service.js";

// نوع ورودی از @xennic/shared می‌آید (اسکیمای aiGenerateSchema) تا قرارداد API در دو جا تعریف نشود
export interface AiGenerateResult {
  model: string;
  tier: AiTier;
  content: string;
  usage: { promptTokens: number; completionTokens: number };
}

/**
 * Multi-Model AI Gateway (نوت ۳ §۲-ج):
 *  • SYSTEM: اتصال رایگان از طریق GitHub Models
 *  • BYOK  : کلید رمزنگاری‌شده‌ی خود کاربر (فقط لحظه‌ی فراخوان رمزگشایی می‌شود)
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
    const { endpoint, apiKey, provider, tier } = await this.resolveTarget(userId, input);
    if (!apiKey) {
      throw new ServiceUnavailableException(
        "برای سطح SYSTEM باید GITHUB_MODELS_TOKEN تنظیم شود؛ یا کلید اختصاصی خود را در /user/ai-settings ثبت کنید",
      );
    }

    const started = Date.now();
    const response = await fetch(`${endpoint.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: input.model ?? "gpt-4o",
        max_tokens: input.maxTokens ?? 1024,
        temperature: input.temperature ?? 0.2,
        messages: [
          ...(input.system ? [{ role: "system", content: input.system }] : []),
          { role: "user", content: input.prompt },
        ],
      }),
    });

    const text = await response.text();
    await this.logCall(userId, provider, input, response.status, Date.now() - started, text);

    if (!response.ok) {
      this.logger.error(`فراخوان AI ناموفق (${response.status})`);
      throw new BadRequestException(`پاسخ ناموفق از ارائه‌دهنده: ${response.status}`);
    }

    const parsed = JSON.parse(text) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    return {
      model: input.model ?? "gpt-4o",
      tier,
      content: parsed.choices?.[0]?.message?.content ?? "",
      usage: {
        promptTokens: parsed.usage?.prompt_tokens ?? 0,
        completionTokens: parsed.usage?.completion_tokens ?? 0,
      },
    };
  }

  /** ارجاع درخواست‌های سنگین به صف (جلوگیری از بالا رفتن بار سرور اصلی — نوت ۵ §۱) */
  public async enqueue(userId: string, input: AiGenerateInput) {
    const job = await this.aiQueue.add("generate", { userId, ...input });
    return { jobId: job.id, status: "QUEUED" as const };
  }

  private async resolveTarget(userId: string, input: AiGenerateInput) {
    const github = this.config.githubModels;

    if (!input.useOwnKey) {
      return {
        endpoint: github.baseUrl,
        apiKey: github.token,
        provider: "GITHUB_MODELS" as const,
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
    const endpoint = credential.provider === "OPENAI" ? "https://api.openai.com/v1" : github.baseUrl;

    await this.prisma.client.aiProviderCredential.update({
      where: { id: credential.id },
      data: { lastUsedAt: new Date() },
    });

    return { endpoint, apiKey, provider: credential.provider, tier: "BYOK" as AiTier };
  }

  private async logCall(
    userId: string,
    provider: string,
    input: AiGenerateInput,
    status: number,
    latencyMs: number,
    raw: string,
  ): Promise<void> {
    await this.prisma.client.aiRequestLog.create({
      data: {
        userId,
        tier: input.useOwnKey ? "BYOK" : "SYSTEM",
        provider,
        model: input.model ?? "gpt-4o",
        purpose: "api.generate",
        status: status < 400 ? "OK" : "ERROR",
        latencyMs,
        errorMessage: status < 400 ? null : raw.slice(0, 500),
      },
    });
  }
}
