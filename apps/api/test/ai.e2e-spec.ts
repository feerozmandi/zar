/**
 * آزمون smoke ماژول AI: لایه‌ی HTTP، اعتبارسنجی zod و قرارداد پاسخ‌ها.
 * اتصال واقعی به PostgreSQL/Redis یا ارائه‌دهنده‌ی مدل لازم نیست؛ فراخوان شبکه mock می‌شود.
 */
import { VersioningType, type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { getQueueToken } from "@nestjs/bullmq";
import type { Request, Response } from "express";
import request from "supertest";
import { QUEUES } from "@xennic/shared";
import { CryptoService } from "../src/common/crypto/crypto.service.js";
import { ApiEnvelopeInterceptor } from "../src/common/interceptors/api-envelope.interceptor.js";
import { AppConfigService } from "../src/config/app-config.service.js";
import { PrismaService } from "../src/infra/prisma/prisma.service.js";
import { AiController } from "../src/modules/ai/ai.controller.js";
import { AiService } from "../src/modules/ai/ai.service.js";

const aiJobs: Array<Record<string, unknown>> = [];

/** شمارنده‌ی قابل تنظیم برای سناریوی سهمیه در تست */
let systemCallsToday = 0;

const prismaFake = {
  client: {
    aiModelCatalog: { findMany: () => Promise.resolve([]) },
    aiProviderCredential: { findFirst: () => Promise.resolve(null), update: () => Promise.resolve({}) },
    aiRequestLog: { create: () => Promise.resolve({}), count: () => Promise.resolve(systemCallsToday) },
    aiJob: {
      create: ({ data }: { data: Record<string, unknown> }) => {
        const job = { id: `aij-${aiJobs.length + 1}`, ...data };
        aiJobs.push(job);
        return Promise.resolve({ id: job.id });
      },
      findFirst: ({ where }: { where: { id: string; userId: string } }) => {
        const job = aiJobs.find((entry) => entry["id"] === where.id && entry["userId"] === where.userId);
        return Promise.resolve(
          job
            ? {
                id: job["id"],
                purpose: job["purpose"] ?? "api.generate",
                status: "QUEUED",
                tier: job["tier"] ?? "SYSTEM",
                provider: null,
                model: null,
                resultText: null,
                promptTokens: 0,
                completionTokens: 0,
                latencyMs: 0,
                errorMessage: null,
                createdAt: new Date("2026-01-01T00:00:00Z"),
                finishedAt: null,
              }
            : null,
        );
      },
      findMany: () => Promise.resolve([]),
      count: () => Promise.resolve(0),
    },
    $transaction: (ops: Promise<unknown>[]) => Promise.all(ops),
  },
};

const configFake = {
  githubModels: { baseUrl: "https://models.example", token: "gh-test-token" },
  encryptionKey: "c".repeat(64),
  aiSystemDailyLimit: 5,
};

describe("AI module (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AiController],
      providers: [
        AiService,
        { provide: PrismaService, useValue: { client: prismaFake.client, ping: () => Promise.resolve(true) } },
        { provide: AppConfigService, useValue: configFake },
        { provide: CryptoService, useValue: { decrypt: () => "sk-decrypted" } },
        { provide: getQueueToken(QUEUES.aiRequest), useValue: { add: () => Promise.resolve({ id: "aij-1" }) } },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use((req: Request, _res: Response, next: () => void) => {
      req.user = { id: "user-1", email: "eng@xennic.ir", role: "PRO_ENGINEER" };
      next();
    });
    app.setGlobalPrefix("api");
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });
    app.useGlobalInterceptors(new ApiEnvelopeInterceptor());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    systemCallsToday = 0;
  });

  it("GET /api/v1/ai/models — فهرست پیش‌فرض در نبود کاتالوگ", async () => {
    const response = await request(app.getHttpServer() as Parameters<typeof request>[0])
      .get("/api/v1/ai/models")
      .expect(200);
    const body = response.body as { success: boolean; data: Array<{ slug: string }> };
    expect(body.success).toBe(true);
    expect(body.data.map((row) => row.slug)).toContain("gpt-4o");
  });

  it("POST /api/v1/ai/generate — بدنه‌ی نامعتبر با 400 رد می‌شود", async () => {
    await request(app.getHttpServer() as Parameters<typeof request>[0])
      .post("/api/v1/ai/generate")
      .send({ prompt: "ab" })
      .expect(400);
  });

  it("POST /api/v1/ai/generate (sync) — پاسخ مدل در قالب envelope", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              choices: [{ message: { content: "تحلیل انجام شد" } }],
              usage: { prompt_tokens: 4, completion_tokens: 8 },
            }),
            { status: 200 },
          ),
        ),
      ),
    );
    const response = await request(app.getHttpServer() as Parameters<typeof request>[0])
      .post("/api/v1/ai/generate")
      .send({ prompt: "این قبض را تحلیل کن" })
      .expect(201);
    const body = response.body as { data: { content: string; tier: string } };
    expect(body.data.content).toBe("تحلیل انجام شد");
    expect(body.data.tier).toBe("SYSTEM");
  });

  it("POST /api/v1/ai/generate (async) — کار در صف و AiJob ثبت می‌شود", async () => {
    const response = await request(app.getHttpServer() as Parameters<typeof request>[0])
      .post("/api/v1/ai/generate")
      .send({ prompt: "سند بزرگ", async: true })
      .expect(201);
    const body = response.body as { data: { jobId: string; status: string } };
    expect(body.data.status).toBe("QUEUED");
    expect(body.data.jobId).toBeTruthy();

    // وضعیت همان کار از GET /ai/jobs/:id خوانده می‌شود
    const jobResponse = await request(app.getHttpServer() as Parameters<typeof request>[0])
      .get(`/api/v1/ai/jobs/${body.data.jobId}`)
      .expect(200);
    const jobBody = jobResponse.body as { data: { status: string } };
    expect(jobBody.data.status).toBe("QUEUED");
  });

  it("GET /api/v1/ai/jobs/:id — کار متعلق به کاربر دیگر 404 می‌گیرد", async () => {
    await request(app.getHttpServer() as Parameters<typeof request>[0])
      .get("/api/v1/ai/jobs/missing-id")
      .expect(404);
  });

  it("POST /api/v1/ai/compare — نتایج چند مدل کنار هم", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) => {
        const rawBody = typeof init?.body === "string" ? init.body : "{}";
        const parsed = JSON.parse(rawBody) as { model?: string };
        return Promise.resolve(
          new Response(
            JSON.stringify({
              choices: [{ message: { content: `پاسخ ${parsed.model ?? "?"}` } }],
              usage: { prompt_tokens: 1, completion_tokens: 1 },
            }),
            { status: 200 },
          ),
        );
      }),
    );
    const response = await request(app.getHttpServer() as Parameters<typeof request>[0])
      .post("/api/v1/ai/compare")
      .send({ prompt: "مقایسه کن", models: ["gpt-4o", "llama-3.3-70b"] })
      .expect(201);
    const body = response.body as { data: { results: Array<{ model: string; ok: boolean }> } };
    expect(body.data.results).toHaveLength(2);
    expect(body.data.results.every((entry) => entry.ok)).toBe(true);
  });

  it("POST /api/v1/ai/compare — بیش از ۳ مدل رد می‌شود", async () => {
    await request(app.getHttpServer() as Parameters<typeof request>[0])
      .post("/api/v1/ai/compare")
      .send({ prompt: "مقایسه کن", models: ["a", "b", "c", "d"] })
      .expect(400);
  });

  it("GET /api/v1/ai/usage — گزارش سهمیه‌ی روزانه", async () => {
    systemCallsToday = 2;
    const response = await request(app.getHttpServer() as Parameters<typeof request>[0])
      .get("/api/v1/ai/usage")
      .expect(200);
    const body = response.body as { data: { used: number; limit: number; remaining: number } };
    expect(body.data).toMatchObject({ used: 2, limit: 5, remaining: 3 });
  });

  it("POST /api/v1/ai/generate — سقف پر با 429 رد می‌شود", async () => {
    systemCallsToday = 5;
    await request(app.getHttpServer() as Parameters<typeof request>[0])
      .post("/api/v1/ai/generate")
      .send({ prompt: "این قبض را تحلیل کن" })
      .expect(429);
  });
});
