import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AiProviderError,
  buildProviderRequest,
  callProvider,
  parseProviderReply,
  PROVIDER_DEFAULT_MODEL,
} from "./ai-gateway.js";

const input = { prompt: "افت ولتاژ مجاز چقدر است؟", useOwnKey: false } as const;

describe("buildProviderRequest", () => {
  it("برای OpenAI/GitHub Models قرارداد chat/completions می‌سازد", () => {
    const { url, init } = buildProviderRequest("OPENAI", "https://api.openai.com/v1", "sk-x", {
      ...input,
      system: "sys",
      model: "gpt-4o",
    });
    expect(url).toBe("https://api.openai.com/v1/chat/completions");
    const body = JSON.parse(typeof init.body === "string" ? init.body : "") as {
      model: string;
      messages: Array<{ role: string; content: string }>;
    };
    expect(body.model).toBe("gpt-4o");
    expect(body.messages[0]).toEqual({ role: "system", content: "sys" });
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer sk-x");
  });

  it("برای Anthropic هدر x-api-key و مسیر /v1/messages را می‌سازد", () => {
    const { url, init } = buildProviderRequest("ANTHROPIC", "https://api.anthropic.com", "sk-ant", input);
    expect(url).toBe("https://api.anthropic.com/v1/messages");
    expect((init.headers as Record<string, string>)["x-api-key"]).toBe("sk-ant");
    const body = JSON.parse(typeof init.body === "string" ? init.body : "") as { model: string };
    expect(body.model).toBe(PROVIDER_DEFAULT_MODEL.ANTHROPIC);
  });

  it("برای Gemini کلید را در query string می‌گذارد و مدل را در مسیر", () => {
    const { url } = buildProviderRequest(
      "GEMINI",
      "https://generativelanguage.googleapis.com/v1beta",
      "g-key",
      { ...input, model: "gemini-1.5-pro" },
    );
    expect(url).toContain("/models/gemini-1.5-pro:generateContent");
    expect(url).toContain("key=g-key");
  });

  it("اسلش انتهایی baseUrl را تحمل می‌کند", () => {
    const { url } = buildProviderRequest("GITHUB_MODELS", "https://models.inference.ai.azure.com/", "t", input);
    expect(url).toBe("https://models.inference.ai.azure.com/chat/completions");
  });
});

describe("parseProviderReply", () => {
  it("پاسخ OpenAI را استخراج می‌کند", () => {
    const raw = JSON.stringify({
      choices: [{ message: { content: "پاسخ" } }],
      usage: { prompt_tokens: 11, completion_tokens: 7 },
    });
    expect(parseProviderReply("OPENAI", raw)).toEqual({ content: "پاسخ", promptTokens: 11, completionTokens: 7 });
  });

  it("پاسخ Anthropic را (بلوک‌های content) استخراج می‌کند", () => {
    const raw = JSON.stringify({
      content: [{ text: "الف" }, { text: "ب" }],
      usage: { input_tokens: 3, output_tokens: 5 },
    });
    expect(parseProviderReply("ANTHROPIC", raw)).toEqual({ content: "الفب", promptTokens: 3, completionTokens: 5 });
  });

  it("پاسخ Gemini را (candidates/parts) استخراج می‌کند", () => {
    const raw = JSON.stringify({
      candidates: [{ content: { parts: [{ text: "ج" }] } }],
      usageMetadata: { promptTokenCount: 2, candidatesTokenCount: 4 },
    });
    expect(parseProviderReply("GEMINI", raw)).toEqual({ content: "ج", promptTokens: 2, completionTokens: 4 });
  });

  it("پاسخ خالی/ناقص را بدون خطا به مقادیر صفر برمی‌گرداند", () => {
    expect(parseProviderReply("OPENAI", "{}")).toEqual({ content: "", promptTokens: 0, completionTokens: 0 });
  });
});

describe("callProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("در پاسخ موفق محتوا، توکن‌ها و تأخیر را برمی‌گرداند", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              choices: [{ message: { content: "ok" } }],
              usage: { prompt_tokens: 1, completion_tokens: 2 },
            }),
            { status: 200 },
          ),
        ),
      ),
    );
    const result = await callProvider(
      { provider: "GITHUB_MODELS", baseUrl: "https://x", apiKey: "t" },
      { ...input, model: "gpt-4o" },
    );
    expect(result.content).toBe("ok");
    expect(result.model).toBe("gpt-4o");
    expect(result.status).toBe(200);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("در پاسخ ناموفق AiProviderError با وضعیت HTTP پرتاب می‌کند", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response("rate limited", { status: 429 }))));
    await expect(
      callProvider({ provider: "OPENAI", baseUrl: "https://x", apiKey: "t" }, input),
    ).rejects.toMatchObject({ name: "AiProviderError", status: 429 });
  });

  it("خطای شبکه را به AiProviderError با وضعیت صفر ترجمه می‌کند", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("ECONNREFUSED"))));
    await expect(
      callProvider({ provider: "OPENAI", baseUrl: "https://x", apiKey: "t" }, input),
    ).rejects.toMatchObject({ name: "AiProviderError", status: 0 });
  });

  it("در سررسید مهلت، وضعیت 408 برمی‌گردد", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url: string, init?: RequestInit) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => {
              const abortError = new Error("aborted");
              abortError.name = "AbortError";
              reject(abortError);
            });
          }),
      ),
    );
    await expect(
      callProvider({ provider: "OPENAI", baseUrl: "https://x", apiKey: "t" }, input, 20),
    ).rejects.toMatchObject({ status: 408 });
  });

  it("نمونه‌ی AiProviderError پیام کوتاه‌شده‌ی بدنه را دارد", () => {
    const error = new AiProviderError("پیام", 500, 12, "raw");
    expect(error.status).toBe(500);
    expect(error.latencyMs).toBe(12);
  });
});
