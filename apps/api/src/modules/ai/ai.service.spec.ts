import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BadRequestException, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import type { Queue as BullQueue } from "bullmq";
import type { AppConfigService } from "../../config/app-config.service.js";
import type { PrismaService } from "../../infra/prisma/prisma.service.js";
import { CryptoService } from "../../common/crypto/crypto.service.js";
import { AiService } from "./ai.service.js";

const ENCRYPTION_KEY = "a".repeat(64);

function okResponse(content = "پاسخ مدل"): Response {
  return new Response(
    JSON.stringify({
      choices: [{ message: { content } }],
      usage: { prompt_tokens: 10, completion_tokens: 20 },
    }),
    { status: 200 },
  );
}

function makeCrypto(): CryptoService {
  const config = { encryptionKey: ENCRYPTION_KEY } as unknown as AppConfigService;
  return new CryptoService(config);
}

interface PrismaMock {
  client: {
    aiModelCatalog: { findMany: ReturnType<typeof vi.fn> };
    aiProviderCredential: { findFirst: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
    aiRequestLog: { create: ReturnType<typeof vi.fn>; count: ReturnType<typeof vi.fn> };
    aiJob: {
      create: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
    };
    $transaction: ReturnType<typeof vi.fn>;
  };
}

function makePrisma(): PrismaMock {
  return {
    client: {
      aiModelCatalog: { findMany: vi.fn(() => Promise.resolve([])) },
      aiProviderCredential: { findFirst: vi.fn(() => Promise.resolve(null)), update: vi.fn(() => Promise.resolve({})) },
      aiRequestLog: { create: vi.fn(() => Promise.resolve({})), count: vi.fn(() => Promise.resolve(0)) },
      aiJob: {
        create: vi.fn(() => Promise.resolve({ id: "job-1" })),
        findFirst: vi.fn(() => Promise.resolve(null)),
        findMany: vi.fn(() => Promise.resolve([])),
        count: vi.fn(() => Promise.resolve(0)),
      },
      $transaction: vi.fn((ops: unknown[]) => Promise.all(ops as Promise<unknown>[])),
    },
  };
}

function makeService(options?: { githubToken?: string; prisma?: PrismaMock; dailyLimit?: number }) {
  const prisma = options?.prisma ?? makePrisma();
  const config = {
    githubModels: { baseUrl: "https://models.example", token: options?.githubToken },
    encryptionKey: ENCRYPTION_KEY,
    aiSystemDailyLimit: options?.dailyLimit ?? 0,
  } as unknown as AppConfigService;
  const queue = { add: vi.fn(() => Promise.resolve({ id: "job-1" })) } as unknown as BullQueue;
  const service = new AiService(prisma as unknown as PrismaService, config, makeCrypto(), queue);
  return { service, prisma, queue };
}

describe("AiService.models", () => {
  it("وقتی کاتالوگ خالی است فهرست پیش‌فرض نوت ۳ را برمی‌گرداند", async () => {
    const { service } = makeService();
    const rows = await service.models();
    expect(rows.map((row) => row.slug)).toEqual(["gpt-4o", "claude-3-5-sonnet", "llama-3.3-70b"]);
  });

  it("وقتی کاتالوگ پر است همان سطرها را برمی‌گرداند", async () => {
    const prisma = makePrisma();
    prisma.client.aiModelCatalog.findMany.mockResolvedValueOnce([
      { slug: "gpt-4o", displayName: "GPT-4o", provider: "OPENAI", supportsVision: true, freeTierOnly: false, maxTokens: 16384 },
    ]);
    const { service } = makeService({ prisma });
    const rows = await service.models();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.provider).toBe("OPENAI");
  });
});

describe("AiService.generate", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("بدون GITHUB_MODELS_TOKEN در سطح SYSTEM خطای ۵۰۳ می‌دهد", async () => {
    const { service } = makeService();
    await expect(service.generate("u-1", { prompt: "تست تست", useOwnKey: false })).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it("در حالت SYSTEM موفق، پاسخ و مصرف توکن را برمی‌گرداند و لاگ ثبت می‌کند", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(okResponse())));
    const { service, prisma } = makeService({ githubToken: "gh-token" });
    const result = await service.generate("u-1", { prompt: "تست تست", useOwnKey: false });
    expect(result.tier).toBe("SYSTEM");
    expect(result.content).toBe("پاسخ مدل");
    expect(result.usage).toEqual({ promptTokens: 10, completionTokens: 20 });
    expect(prisma.client.aiRequestLog.create).toHaveBeenCalledOnce();
  });

  it("BYOK بدون کلید ثبت‌شده خطای BadRequest می‌دهد", async () => {
    const { service } = makeService({ githubToken: "gh" });
    await expect(service.generate("u-1", { prompt: "تست تست", useOwnKey: true })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("BYOK کلید کاربر را رمزگشایی و به آدرس ارائه‌دهنده‌ی خودش می‌فرستد", async () => {
    const crypto = makeCrypto();
    const encrypted = crypto.encrypt("sk-user-secret");
    const prisma = makePrisma();
    prisma.client.aiProviderCredential.findFirst.mockResolvedValueOnce({
      id: "cred-1",
      provider: "OPENAI",
      encryptedKey: encrypted.ciphertext,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
    });
    const fetchMock = vi.fn(() => Promise.resolve(okResponse()));
    vi.stubGlobal("fetch", fetchMock);

    const { service } = makeService({ prisma });
    const result = await service.generate("u-1", { prompt: "تست تست", useOwnKey: true });

    expect(result.tier).toBe("BYOK");
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.openai.com/v1/chat/completions");
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer sk-user-secret");
    expect(prisma.client.aiProviderCredential.update).toHaveBeenCalledOnce();
  });

  it("خطای ارائه‌دهنده به BadRequest ترجمه و لاگ خطا ثبت می‌شود", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response("boom", { status: 500 }))));
    const { service, prisma } = makeService({ githubToken: "gh" });
    await expect(service.generate("u-1", { prompt: "تست تست", useOwnKey: false })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    const logArgs = prisma.client.aiRequestLog.create.mock.calls[0]?.[0] as { data: { status: string } };
    expect(logArgs.data.status).toBe("ERROR");
  });
});

describe("AiService.compare (AI Arena)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("چند مدل را هم‌زمان فراخوانی و نتایج را کنار هم برمی‌گرداند", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) => {
        const body = JSON.parse(typeof init?.body === "string" ? init.body : "") as { model: string };
        return okResponse(`پاسخ ${body.model}`);
      }),
    );
    const { service } = makeService({ githubToken: "gh" });
    const result = await service.compare("u-1", {
      prompt: "مقایسه کن",
      models: ["gpt-4o", "llama-3.3-70b"],
      useOwnKey: false,
    });
    expect(result.tier).toBe("SYSTEM");
    expect(result.results).toHaveLength(2);
    expect(result.results.map((entry) => entry.content)).toEqual(["پاسخ gpt-4o", "پاسخ llama-3.3-70b"]);
  });

  it("خطای یک مدل نتیجه‌ی مدل‌های دیگر را از بین نمی‌برد", async () => {
    let call = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(() => {
        call += 1;
        return Promise.resolve(call === 1 ? new Response("rate", { status: 429 }) : okResponse("سالم"));
      }),
    );
    const { service } = makeService({ githubToken: "gh" });
    const result = await service.compare("u-1", {
      prompt: "مقایسه کن",
      models: ["m1", "m2"],
      useOwnKey: false,
    });
    const failed = result.results.find((entry) => !entry.ok);
    const succeeded = result.results.find((entry) => entry.ok);
    expect(failed?.errorMessage).toContain("429");
    expect(succeeded?.content).toBe("سالم");
  });

  it("مدل‌های تکراری فقط یک بار فراخوانی می‌شوند", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(okResponse()));
    vi.stubGlobal("fetch", fetchMock);
    const { service } = makeService({ githubToken: "gh" });
    await service.compare("u-1", { prompt: "تست تست", models: ["gpt-4o", "gpt-4o"], useOwnKey: false });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("AiService — سهمیه‌ی روزانه‌ی SYSTEM", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("زیر سقف: فراخوان عبور می‌کند", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(okResponse())));
    const prisma = makePrisma();
    prisma.client.aiRequestLog.count.mockResolvedValue(4);
    const { service } = makeService({ githubToken: "gh", prisma, dailyLimit: 5 });
    const result = await service.generate("u-1", { prompt: "تست تست", useOwnKey: false });
    expect(result.content).toBe("پاسخ مدل");
  });

  it("سقف پر: خطای 429 با پیام سهمیه", async () => {
    const prisma = makePrisma();
    prisma.client.aiRequestLog.count.mockResolvedValue(5);
    const { service } = makeService({ githubToken: "gh", prisma, dailyLimit: 5 });
    await expect(service.generate("u-1", { prompt: "تست تست", useOwnKey: false })).rejects.toMatchObject({
      status: 429,
    });
  });

  it("compare هزینه‌ی همه‌ی مدل‌ها را یکجا حساب می‌کند (۲ مدل با ۱ فراخوان باقی‌مانده → رد)", async () => {
    const prisma = makePrisma();
    prisma.client.aiRequestLog.count.mockResolvedValue(4); // limit 5 → فقط ۱ باقی
    const { service } = makeService({ githubToken: "gh", prisma, dailyLimit: 5 });
    await expect(
      service.compare("u-1", { prompt: "مقایسه کن", models: ["m1", "m2"], useOwnKey: false }),
    ).rejects.toMatchObject({ status: 429 });
  });

  it("BYOK سهمیه ندارد (شمارش اصلاً انجام نمی‌شود)", async () => {
    const crypto = makeCrypto();
    const encrypted = crypto.encrypt("sk-user-secret");
    const prisma = makePrisma();
    prisma.client.aiRequestLog.count.mockResolvedValue(999);
    prisma.client.aiProviderCredential.findFirst.mockResolvedValueOnce({
      id: "cred-1",
      provider: "OPENAI",
      encryptedKey: encrypted.ciphertext,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
    });
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(okResponse())));
    const { service } = makeService({ prisma, dailyLimit: 5 });
    const result = await service.generate("u-1", { prompt: "تست تست", useOwnKey: true });
    expect(result.tier).toBe("BYOK");
  });

  it("enqueue با سقف پر، کار را وارد صف نمی‌کند", async () => {
    const prisma = makePrisma();
    prisma.client.aiRequestLog.count.mockResolvedValue(5);
    const { service, queue } = makeService({ githubToken: "gh", prisma, dailyLimit: 5 });
    await expect(service.enqueue("u-1", { prompt: "کار سنگین", useOwnKey: false })).rejects.toMatchObject({
      status: 429,
    });
    expect(prisma.client.aiJob.create).not.toHaveBeenCalled();
    expect((queue.add as unknown as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(0);
  });

  it("limit=0 یعنی نامحدود", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(okResponse())));
    const prisma = makePrisma();
    prisma.client.aiRequestLog.count.mockResolvedValue(100_000);
    const { service } = makeService({ githubToken: "gh", prisma, dailyLimit: 0 });
    const result = await service.generate("u-1", { prompt: "تست تست", useOwnKey: false });
    expect(result.content).toBe("پاسخ مدل");
  });

  it("usage گزارش مصرف/باقی‌مانده/resetAt می‌دهد", async () => {
    const prisma = makePrisma();
    prisma.client.aiRequestLog.count.mockResolvedValue(3);
    const { service } = makeService({ githubToken: "gh", prisma, dailyLimit: 10 });
    const usage = await service.usage("u-1");
    expect(usage).toMatchObject({ tier: "SYSTEM", used: 3, limit: 10, remaining: 7 });
    expect(new Date(usage.resetAt).getTime()).toBeGreaterThan(Date.now());
  });
});

describe("AiService.enqueue / jobs", () => {
  let service: AiService;
  let prisma: PrismaMock;
  let queue: BullQueue;

  beforeEach(() => {
    const made = makeService({ githubToken: "gh" });
    service = made.service;
    prisma = made.prisma;
    queue = made.queue;
  });

  it("enqueue رکورد AiJob می‌سازد و همان شناسه را به صف می‌دهد", async () => {
    const result = await service.enqueue("u-1", { prompt: "کار سنگین", useOwnKey: false });
    expect(result).toEqual({ jobId: "job-1", status: "QUEUED" });
    expect(prisma.client.aiJob.create).toHaveBeenCalledOnce();
    const addMock = (queue.add as unknown as ReturnType<typeof vi.fn>).mock;
    expect(addMock.calls[0]?.[2]).toEqual({ jobId: "job-1" });
    // پرامپت در inputJson ماندگار می‌شود ولی کلیدی ذخیره نمی‌شود
    const createArgs = prisma.client.aiJob.create.mock.calls[0]?.[0] as { data: { inputJson: Record<string, unknown> } };
    expect(createArgs.data.inputJson["prompt"]).toBe("کار سنگین");
    expect(Object.keys(createArgs.data.inputJson)).not.toContain("apiKey");
  });

  it("job فقط برای صاحبش برمی‌گردد و در نبود، NotFound می‌دهد", async () => {
    await expect(service.job("u-1", "missing")).rejects.toBeInstanceOf(NotFoundException);

    prisma.client.aiJob.findFirst.mockResolvedValueOnce({
      id: "job-1",
      purpose: "api.generate",
      status: "SUCCEEDED",
      tier: "SYSTEM",
      provider: "GITHUB_MODELS",
      model: "gpt-4o",
      resultText: "نتیجه",
      promptTokens: 1,
      completionTokens: 2,
      latencyMs: 100,
      errorMessage: null,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      finishedAt: new Date("2026-01-01T00:00:05Z"),
    });
    const job = await service.job("u-1", "job-1");
    expect(job.status).toBe("SUCCEEDED");
    expect(job.createdAt).toBe("2026-01-01T00:00:00.000Z");
    expect(job.finishedAt).toBe("2026-01-01T00:00:05.000Z");
  });

  it("jobs فهرست صفحه‌بندی‌شده برمی‌گرداند", async () => {
    prisma.client.aiJob.findMany.mockResolvedValueOnce([]);
    prisma.client.aiJob.count.mockResolvedValueOnce(0);
    const result = await service.jobs("u-1", 1, 20);
    expect(result.meta).toEqual({ page: 1, pageSize: 20, total: 0 });
  });
});
