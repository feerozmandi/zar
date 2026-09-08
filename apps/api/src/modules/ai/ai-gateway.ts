/**
 * دروازه‌ی چندمدلی AI — لایه‌ی خالص و بدون وابستگی به NestJS (نوت ۳ §۲-ج).
 *
 * این فایل تنها مرجع «قرارداد HTTP هر ارائه‌دهنده» است تا:
 *  • AiService (پاسخ هم‌زمان) و worker صف (پردازش ناهم‌زمان) از یک منطق استفاده کنند؛
 *  • توابع بدون mock شبکه‌ی Nest قابل تست واحد باشند.
 */
import type { AiGenerateInput } from "@xennic/shared";

export type AiProviderName = "GITHUB_MODELS" | "OPENAI" | "ANTHROPIC" | "GEMINI";

/** آدرس پایه‌ی هر ارائه‌دهنده — برای BYOK (نوت ۳ §۲-ج) */
export const PROVIDER_BASE_URL: Record<AiProviderName, string> = {
  GITHUB_MODELS: "https://models.inference.ai.azure.com",
  OPENAI: "https://api.openai.com/v1",
  ANTHROPIC: "https://api.anthropic.com",
  GEMINI: "https://generativelanguage.googleapis.com/v1beta",
};

export const PROVIDER_DEFAULT_MODEL: Record<AiProviderName, string> = {
  GITHUB_MODELS: "gpt-4o",
  OPENAI: "gpt-4o",
  ANTHROPIC: "claude-3-5-sonnet",
  GEMINI: "gemini-1.5-pro",
};

export interface RawReply {
  content: string;
  promptTokens: number;
  completionTokens: number;
}

export interface ProviderCallResult extends RawReply {
  model: string;
  status: number;
  latencyMs: number;
}

export class AiProviderError extends Error {
  public constructor(
    message: string,
    public readonly status: number,
    public readonly latencyMs: number,
    public readonly raw: string,
  ) {
    super(message);
    this.name = "AiProviderError";
  }
}

/** ورودی موردنیاز برای یک فراخوان کامل (کلید از قبل رمزگشایی‌شده) */
export interface GatewayCallTarget {
  provider: AiProviderName;
  baseUrl: string;
  apiKey: string;
}

/** ساخت درخواست مطابق قرارداد هر ارائه‌دهنده — خروجی قابل تست بدون شبکه */
export function buildProviderRequest(
  provider: AiProviderName,
  baseUrl: string,
  apiKey: string,
  input: AiGenerateInput,
): { url: string; init: RequestInit } {
  const model = input.model ?? PROVIDER_DEFAULT_MODEL[provider];
  const maxTokens = input.maxTokens ?? 1024;
  const temperature = input.temperature ?? 0.2;
  const root = baseUrl.replace(/\/$/, "");

  switch (provider) {
    case "ANTHROPIC": {
      return {
        url: `${root}/v1/messages`,
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
        url: `${root}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
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
        url: `${root}/chat/completions`,
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
export function parseProviderReply(provider: AiProviderName, raw: string): RawReply {
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

/**
 * فراخوان کامل یک ارائه‌دهنده: ساخت درخواست → fetch → استخراج پاسخ.
 * در پاسخ ناموفق AiProviderError پرتاب می‌شود تا لایه‌ی بالادست (API یا worker)
 * تصمیم لاگ/ترجمه‌ی خطا را خودش بگیرد.
 */
export async function callProvider(
  target: GatewayCallTarget,
  input: AiGenerateInput,
  timeoutMs = 60_000,
): Promise<ProviderCallResult> {
  const { url, init } = buildProviderRequest(target.provider, target.baseUrl, target.apiKey, input);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();

  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const raw = await response.text();
    const latencyMs = Date.now() - started;

    if (!response.ok) {
      throw new AiProviderError(
        `پاسخ ناموفق از ارائه‌دهنده: ${response.status}${raw ? ` — ${raw.slice(0, 200)}` : ""}`,
        response.status,
        latencyMs,
        raw,
      );
    }

    const reply = parseProviderReply(target.provider, raw);
    return {
      ...reply,
      model: input.model ?? PROVIDER_DEFAULT_MODEL[target.provider],
      status: response.status,
      latencyMs,
    };
  } catch (error) {
    if (error instanceof AiProviderError) throw error;
    const latencyMs = Date.now() - started;
    const isTimeout = error instanceof Error && error.name === "AbortError";
    throw new AiProviderError(
      isTimeout ? `مهلت پاسخ ارائه‌دهنده (${timeoutMs}ms) تمام شد` : `خطای شبکه در فراخوان ارائه‌دهنده: ${String(error)}`,
      isTimeout ? 408 : 0,
      latencyMs,
      "",
    );
  } finally {
    clearTimeout(timer);
  }
}
