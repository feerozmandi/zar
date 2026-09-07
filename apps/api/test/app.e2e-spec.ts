/**
 * آزمون پیکان-سبز (smoke) فاز ۱: لایه‌ی HTTP، pipeها و interceptorها باید درست
 * به هم وصل شده باشند. اتصال واقعی به PostgreSQL/Redis در این آزمون لازم نیست.
 */
import { VersioningType, type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getQueueToken } from "@nestjs/bullmq";
import type { Request, Response } from "express";
import request from "supertest";
import { QUEUES, calculateVoltageDrop } from "@xennic/shared";
import { ApiEnvelopeInterceptor } from "../src/common/interceptors/api-envelope.interceptor.js";
import { PrismaService } from "../src/infra/prisma/prisma.service.js";
import { EngineeringController } from "../src/modules/engineering/engineering.controller.js";
import { EngineeringService } from "../src/modules/engineering/engineering.service.js";

const created: unknown[] = [];

const prismaFake = {
  client: {
    engineeringCalculation: {
      create: ({ data }: { data: unknown }) => {
        created.push(data);
        return Promise.resolve({ id: "calc-1" });
      },
    },
  },
} as unknown as Pick<PrismaService, "client">;

describe("Engineering module (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [EngineeringController],
      providers: [
        EngineeringService,
        {
          provide: PrismaService,
          useValue: { client: prismaFake.client, ping: () => Promise.resolve(true) },
        },
        {
          provide: getQueueToken(QUEUES.pdfExport),
          useValue: { add: () => Promise.resolve({ id: "job-1" }) },
        },
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

  it("POST /api/v1/engineering/voltage-drop → پاسخ محاسباتی با پاکت یکدست", async () => {
    const body = {
      system: "three" as const,
      voltage: 400,
      current: 100,
      length: 120,
      conductor: "copper" as const,
      powerFactor: 0.85,
    };
    const response = await request(app.getHttpServer() as Parameters<typeof request>[0])
      .post("/api/v1/engineering/voltage-drop")
      .send(body)
      .expect(201);

    const expected = calculateVoltageDrop({ ...body, conductivity: 56 });
    const payload = response.body as { success: boolean; data: { dropPercent: number } };
    expect(payload.success).toBe(true);
    expect(payload.data.dropPercent).toBeCloseTo(expected.dropPercent, 2);
    expect(created).toHaveLength(1);
  });

  it("اعتبارسنجی zod خطای ۴۰۰ با جزئیات فیلد برمی‌گرداند", async () => {
    const response = await request(app.getHttpServer() as Parameters<typeof request>[0])
      .post("/api/v1/engineering/voltage-drop")
      .send({ system: "five", voltage: -1 })
      .expect(400);
    expect(JSON.stringify(response.body)).toMatch(/path/iu);
  });
});
