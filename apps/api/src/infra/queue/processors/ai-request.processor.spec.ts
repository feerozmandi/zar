import { afterEach, describe, expect, it, vi } from "vitest";
import type { Job } from "bullmq";
import type { PrismaClient } from "@xennic/database";
import { aesGcmEncrypt, keyFromHex } from "../../../common/crypto/aes-gcm.js";
import {
  buildWikiContext,
  processAiRequestJob,
  processGenerateJob,
  processWikiAskJob,
  type AiWorkerContext,
} from "./ai-request.processor.js";

const ENCRYPTION_KEY = "b".repeat(64);

function okResponse(content = "پاسخ"): Response {
  return new Response(
    JSON.stringify({ choices: [{ message: { content } }], usage: { prompt_tokens: 5, completion_tokens: 6 } }),
    { status: 200 },
  );
}

function makePrisma() {
  const jobUpdates: Array<Record<string, unknown>> = [];
  return {
    jobUpdates,
    aiJob: {
      update: vi.fn(({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        jobUpdates.push({ id: where.id, ...data });
        return Promise.resolve({});
      }),
    },
    aiProviderCredential: {
      findFirst: vi.fn<() => Promise<Record<string, unknown> | null>>(() => Promise.resolve(null)),
      update: vi.fn(() => Promise.resolve({})),
    },
    aiRequestLog: { create: vi.fn(() => Promise.resolve({})) },
    wikiArticle: { findMany: vi.fn<() => Promise<Array<Record<string, unknown>>>>(() => Promise.resolve([])) },
  };
}

function makeContext(options?: { token?: string; prisma?: ReturnType<typeof makePrisma> }): {
  ctx: AiWorkerContext;
  prisma: ReturnType<typeof makePrisma>;
} {
  const prisma = options?.prisma ?? makePrisma();
  return {
    ctx: {
      prisma: prisma as unknown as PrismaClient,
      encryptionKeyHex: ENCRYPTION_KEY,
      githubModels: { baseUrl: "https://models.example", token: options?.token },
    },
    prisma,
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("processGenerateJob", () => {
  it("چرخه‌ی کامل: RUNNING → فراخوان → SUCCEEDED با نتیجه و توکن‌ها", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(okResponse("خروجی"))));
    const { ctx, prisma } = makeContext({ token: "gh" });

    const result = await processGenerateJob(ctx, {
      aiJobId: "aij-1",
      userId: "u-1",
      prompt: "تحلیل کن",
      useOwnKey: false,
    });

    expect(result.ok).toBe(true);
    const statuses = prisma.jobUpdates.map((update) => update["status"]);
    expect(statuses).toEqual(["RUNNING", "SUCCEEDED"]);
    const final = prisma.jobUpdates.at(-1);
    expect(final?.["resultText"]).toBe("خروجی");
    expect(final?.["promptTokens"]).toBe(5);
    expect(prisma.aiRequestLog.create).toHaveBeenCalledOnce();
  });

  it("در خطای ارائه‌دهنده، AiJob با FAILED و پیام خطا به‌روزرسانی و خطا بازپرتاب می‌شود", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response("boom", { status: 500 }))));
    const { ctx, prisma } = makeContext({ token: "gh" });

    await expect(
      processGenerateJob(ctx, { aiJobId: "aij-1", userId: "u-1", prompt: "تحلیل", useOwnKey: false }),
    ).rejects.toThrow();

    const final = prisma.jobUpdates.at(-1);
    expect(final?.["status"]).toBe("FAILED");
    expect(String(final?.["errorMessage"])).toContain("500");
  });

  it("BYOK: کلید رمزنگاری‌شده‌ی کاربر رمزگشایی و استفاده می‌شود", async () => {
    const encrypted = aesGcmEncrypt(keyFromHex(ENCRYPTION_KEY), "sk-worker-secret");
    const prisma = makePrisma();
    prisma.aiProviderCredential.findFirst.mockResolvedValueOnce({
      id: "cred-1",
      provider: "OPENAI",
      encryptedKey: encrypted.ciphertext,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
    });
    const fetchMock = vi.fn(() => Promise.resolve(okResponse()));
    vi.stubGlobal("fetch", fetchMock);

    const { ctx } = makeContext({ prisma });
    await processGenerateJob(ctx, { aiJobId: "aij-2", userId: "u-1", prompt: "تحلیل", useOwnKey: true });

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer sk-worker-secret");
  });

  it("بدون توکن SYSTEM شکست می‌خورد و وضعیت FAILED ثبت می‌شود", async () => {
    const { ctx, prisma } = makeContext();
    await expect(
      processGenerateJob(ctx, { aiJobId: "aij-3", userId: "u-1", prompt: "تحلیل", useOwnKey: false }),
    ).rejects.toThrow("GITHUB_MODELS_TOKEN");
    expect(prisma.jobUpdates.at(-1)?.["status"]).toBe("FAILED");
  });
});

describe("processWikiAskJob", () => {
  it("زمینه‌ی مقالات را در پرامپت می‌گنجاند و پاسخ را ماندگار می‌کند", async () => {
    const prisma = makePrisma();
    prisma.wikiArticle.findMany.mockResolvedValueOnce([
      { title: "مبحث ۱۳", source: "NATIONAL_REGULATION_13", contentMdx: "متن ماده ۱۳-۱" },
    ]);
    const fetchMock = vi.fn(() => Promise.resolve(okResponse("پاسخ مستند")));
    vi.stubGlobal("fetch", fetchMock);

    const { ctx } = makeContext({ token: "gh", prisma });
    const result = await processWikiAskJob(ctx, {
      aiJobId: "aij-4",
      userId: "u-1",
      question: "حداقل سطح مقطع سیم ارت چقدر است؟",
      articleIds: ["a-1"],
    });

    expect(result.ok).toBe(true);
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const body = JSON.parse(typeof init.body === "string" ? init.body : "") as { messages: Array<{ role: string; content: string }> };
    const userMessage = body.messages.find((message) => message.role === "user");
    expect(userMessage?.content).toContain("مبحث ۱۳");
    expect(userMessage?.content).toContain("حداقل سطح مقطع سیم ارت");
    expect(body.messages[0]?.role).toBe("system");
    expect(prisma.jobUpdates.at(-1)?.["resultText"]).toBe("پاسخ مستند");
  });

  it("بدون articleIds هم کار می‌کند (فقط پرسش)", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(okResponse())));
    const { ctx } = makeContext({ token: "gh" });
    const result = await processWikiAskJob(ctx, {
      aiJobId: "aij-5",
      userId: "u-1",
      question: "سوال آزاد؟",
      articleIds: [],
    });
    expect(result.ok).toBe(true);
  });
});

describe("buildWikiContext", () => {
  it("زمینه را به سقف نویسه محدود می‌کند", async () => {
    const prisma = makePrisma();
    prisma.wikiArticle.findMany.mockResolvedValueOnce([
      { title: "الف", source: "IEC", contentMdx: "x".repeat(500) },
      { title: "ب", source: "IEC", contentMdx: "y".repeat(500) },
    ]);
    const context = await buildWikiContext(prisma as unknown as PrismaClient, ["a", "b"], 200);
    expect(context.length).toBeLessThanOrEqual(220);
    expect(context).toContain("الف");
  });

  it("برای فهرست خالی رشته‌ی خالی برمی‌گرداند", async () => {
    const prisma = makePrisma();
    const context = await buildWikiContext(prisma as unknown as PrismaClient, []);
    expect(context).toBe("");
    expect(prisma.wikiArticle.findMany).not.toHaveBeenCalled();
  });
});

describe("processAiRequestJob (نگاشت نام کار)", () => {
  it("کار ناشناخته skip می‌شود تا صف مسدود نشود", async () => {
    const { ctx } = makeContext({ token: "gh" });
    const result = await processAiRequestJob(ctx, { name: "unknown-kind", data: {} } as unknown as Job);
    expect(result).toMatchObject({ status: "skipped" });
  });
});
