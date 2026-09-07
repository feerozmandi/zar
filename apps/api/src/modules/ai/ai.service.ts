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

type AiProviderName = "GITHUB_MODELS" | "OPENAI" | "ANTHROPIC" | "GEMINI";

/** آدرس پایه و مدل پیش‌فرض هر ارائه‌دهنده — برای BYOK (نوت ۳ §۲-ج) */
const PROVIDER_BASE_URL: Record<AiProviderName, string> = {
  GITHUB_MODELS: "https://models.inference.ai.azure.com",
  OPENAI: "https://api.openai.com/v1",
  ANTHROPIC: "https://api.anthropic.com",
  GEMINI: "https://generativelanguage.googleapis.com/v1beta",
};

const PROVIDER_DEFAULT_MODEL: Record<AiProviderName, string> = {
  GITHUB_MODELS: "gpt-4o",
  OPENAI: "gpt-4o",
  ANTHROPIC: "claude-3-5-sonnet",
  GEMINI: "gemini-1.5-pro",
};

interface RawReply {
  content: string;
  promptTokens: number;
  completionTokens: number;
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

    const { url, init } = this.buildRequest(provider, endpoint, apiKey, input);
    const started = Date.now();
    let raw = "";
    let status = 0;
    try {
      const response = await fetch(url, init);
      status = response.status;
      raw = await response.text();

      if (!response.ok) {
        this.logger.error(`فراخوان AI ناموفق (${status}) برای ${provider}`);
        throw new BadRequestException(
          `پاسخ ناموفق از ارائه‌دهنده: ${status}${raw ? ` — ${raw.slice(0, 200)}` : ""}`,
        );
      }
      const reply = this.parseRawReply(provider, raw);
      return {
        model: input.model ?? PROVIDER_DEFAULT_MODEL[provider],
        tier,
        content: reply.content,
        usage: {
          promptTokens: reply.promptTokens,
          completionTokens: reply.completionTokens,
        },
      };
    } finally {
      if (status > 0) {
        await this.logCall(userId, provider, input, status, Date.now() - started, raw);
      }
    }
  }

  /** ارجاع درخواست‌های سنگین به صف (جلوگیری از بالا رفتن بار سرور اصلی — نوت ۵ §۱) */
  public async enqueue(userId: string, input: AiGenerateInput) {
    const job = await this.aiQueue.add("generate", { userId, ...input });
    return { jobId: job.id, status: "QUEUED" as const };
  }

  private async resolveTarget(
    userId: string,
    input: AiGenerateInput,
  ): Promise<{ endpoint: string; apiKey?: string; provider: AiProviderName; tier: AiTier }> {
    const github = this.config.githubModels;

    if (!input.useOwnKey) {
      return {
        endpoint: github.baseUrl,
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
    const endpoint =
      credential.provider === "GITHUB_MODELS" ? github.baseUrl : PROVIDER_BASE_URL[credential.provider];

    await this.prisma.client.aiProviderCredential.update({
      where: { id: credential.id },
      data: { lastUsedAt: new Date() },
    });

    return { endpoint, apiKey, provider: credential.provider, tier: "BYOK" as AiTier };
  }

  /** ساخت درخواست مطابق قرارداد هر ارائه‌دهنده */
  private buildRequest(
    provider: AiProviderName,
    baseUrl: string,
    apiKey: string,
    input: AiGenerateInput,
  ): { url: string; init: RequestInit } {
    const model = input.model ?? PROVIDER_DEFAULT_MODEL[provider];
    const maxTokens = input.maxTokens ?? 1024;
    const temperature = input.temperature ?? 0.2;

    switch (provider) {
      case "ANTHROPIC": {
        return {
          url: `${baseUrl.replace(/\/$/, "")}/v1/messages`,
          init: {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "x-api-key": apiKey,
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model,
              max_tokens: maxTokens,
              system: input.system ?? "",
              temperature,
              messages: [{ role: "user", content: input.prompt }],
            }),
          },
        };
      }
      case "GEMINI": {
        return {
          url: `${baseUrl.replace(/\/$/, "")}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
          init: {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              system_instruction: input.system ? { parts: [{ text: input.system }] } : undefined,
              contents: [{ role: "user", parts: [{ text: input.prompt }] }],
              generationConfig: { maxOutputTokens: maxTokens, temperature },
            }),
          },
        };
      }
      default: {
        // GITHUB_MODELS و OPENAI — هر دو سازگار با قرارداد chat/completions
        return {
          url: `${baseUrl.replace(/\/$/, "")}/chat/completions`,
          init: {
            method: "POST",
            headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({
              model,
              max_tokens: maxTokens,
              temperature,
              messages: [
                ...(input.system ? [{ role: "system", content: input.system }] : []),
                { role: "user", content: input.prompt },
              ],
            }),
          },
        };
      }
    }
  }

  /** استخراج پاسخ مطابق ساختار هر ارائه‌دهنده */
  private parseRawReply(provider: AiProviderName, raw: string): RawReply {
    const parsed = JSON.parse(raw) as {
      content?: Array<{ text?: string }>;
      choices?: Array<{ message?: { content?: string } }>;
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number; input_tokens?: number; output_tokens?: number };
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
    };

    if (provider === "ANTHROPIC") {
      return {
        content: (parsed.content ?? []).map((block) => block.text ?? "").join(""),
        promptTokens: parsed.usage?.input_tokens ?? 0,
        completionTokens: parsed.usage?.output_tokens ?? 0,
      };
    }
    if (provider === "GEMINI") {
      return {
        content: parsed.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "",
        promptTokens: parsed.usageMetadata?.promptTokenCount ?? 0,
        completionTokens: parsed.usageMetadata?.candidatesTokenCount ?? 0,
      };
    }
    return {
      content: parsed.choices?.[0]?.message?.content ?? "",
      promptTokens: parsed.usage?.prompt_tokens ?? 0,
      completionTokens: parsed.usage?.completion_tokens ?? 0,
    };
  }

  private async logCall(
    userId: string,
    provider: "GITHUB_MODELS" | "OPENAI" | "ANTHROPIC" | "GEMINI",
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
