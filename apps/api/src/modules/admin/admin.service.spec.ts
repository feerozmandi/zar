import { describe, expect, it, vi } from "vitest";
import { NotFoundException } from "@nestjs/common";
import type { PrismaService } from "../../infra/prisma/prisma.service.js";
import { AdminService } from "./admin.service.js";

function makePrisma() {
  const catalog = new Map<string, Record<string, unknown>>();
  const auditLogs: Array<Record<string, unknown>> = [];
  return {
    catalog,
    auditLogs,
    client: {
      aiModelCatalog: {
        findMany: vi.fn(() => Promise.resolve([...catalog.values()])),
        findUnique: vi.fn(({ where }: { where: { slug: string } }) =>
          Promise.resolve(catalog.get(where.slug) ?? null),
        ),
        upsert: vi.fn(
          ({ where, update, create }: { where: { slug: string }; update: Record<string, unknown>; create: Record<string, unknown> }) => {
            const existing = catalog.get(where.slug);
            const saved = existing ? { ...existing, ...update } : { id: `m-${catalog.size + 1}`, ...create };
            catalog.set(where.slug, saved);
            return Promise.resolve(saved);
          },
        ),
        update: vi.fn(({ where, data }: { where: { slug: string }; data: Record<string, unknown> }) => {
          const saved = { ...catalog.get(where.slug), ...data };
          catalog.set(where.slug, saved);
          return Promise.resolve(saved);
        }),
        delete: vi.fn(({ where }: { where: { slug: string } }) => {
          catalog.delete(where.slug);
          return Promise.resolve({});
        }),
      },
      adminAuditLog: {
        create: vi.fn(({ data }: { data: Record<string, unknown> }) => {
          auditLogs.push(data);
          return Promise.resolve(data);
        }),
      },
    },
  };
}

function makeService() {
  const prisma = makePrisma();
  const service = new AdminService(prisma as unknown as PrismaService);
  return { service, prisma };
}

const sampleModel = {
  slug: "gpt-4o-mini",
  provider: "OPENAI" as const,
  displayName: "GPT-4o mini",
  supportsVision: true,
  inputPrice: 0.15,
  outputPrice: 0.6,
  maxTokens: 16384,
  freeTierOnly: false,
  isActive: true,
};

describe("AdminService — مدیریت کاتالوگ مدل‌های AI", () => {
  it("upsert مدل جدید می‌سازد و اقدام در لاگ ممیزی ثبت می‌شود", async () => {
    const { service, prisma } = makeService();
    const saved = await service.upsertAiModel(sampleModel, "admin-1", "10.0.0.1");
    expect(saved).toMatchObject({ slug: "gpt-4o-mini", provider: "OPENAI" });
    expect(prisma.auditLogs).toHaveLength(1);
    expect(prisma.auditLogs[0]).toMatchObject({
      actorId: "admin-1",
      action: "ai-model.upsert",
      target: "gpt-4o-mini",
      ip: "10.0.0.1",
    });
  });

  it("upsert روی slug موجود، مدل را به‌روزرسانی می‌کند", async () => {
    const { service, prisma } = makeService();
    await service.upsertAiModel(sampleModel, "admin-1");
    await service.upsertAiModel({ ...sampleModel, displayName: "نام جدید" }, "admin-1");
    expect(prisma.catalog.get("gpt-4o-mini")?.["displayName"]).toBe("نام جدید");
    expect(prisma.catalog.size).toBe(1);
  });

  it("patch مدل ناموجود NotFound می‌دهد", async () => {
    const { service } = makeService();
    await expect(service.patchAiModel("missing", { isActive: false }, "admin-1")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("patch فقط فیلدهای داده‌شده را تغییر می‌دهد (غیرفعال‌سازی)", async () => {
    const { service, prisma } = makeService();
    await service.upsertAiModel(sampleModel, "admin-1");
    const saved = await service.patchAiModel("gpt-4o-mini", { isActive: false }, "admin-1");
    expect(saved["isActive"]).toBe(false);
    expect(saved["displayName"]).toBe("GPT-4o mini");
    expect(prisma.auditLogs.at(-1)).toMatchObject({ action: "ai-model.patch" });
  });

  it("delete مدل موجود را حذف و ثبت ممیزی می‌کند؛ ناموجود NotFound", async () => {
    const { service, prisma } = makeService();
    await service.upsertAiModel(sampleModel, "admin-1");
    const result = await service.deleteAiModel("gpt-4o-mini", "admin-1");
    expect(result).toEqual({ slug: "gpt-4o-mini", deleted: true });
    expect(prisma.catalog.size).toBe(0);
    expect(prisma.auditLogs.at(-1)).toMatchObject({ action: "ai-model.delete" });
    await expect(service.deleteAiModel("gpt-4o-mini", "admin-1")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("شکست لاگ ممیزی، عملیات اصلی را خراب نمی‌کند", async () => {
    const { service, prisma } = makeService();
    prisma.client.adminAuditLog.create.mockRejectedValueOnce(new Error("db down"));
    const saved = await service.upsertAiModel(sampleModel, "admin-1");
    expect(saved).toMatchObject({ slug: "gpt-4o-mini" });
  });
});
