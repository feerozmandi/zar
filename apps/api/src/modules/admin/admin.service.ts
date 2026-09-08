import { Injectable, NotFoundException } from "@nestjs/common";
import {
  ROLES,
  WIKI_SOURCE_BY_SLUG,
  type AiModelPatchInput,
  type AiModelUpsertInput,
  type ArticleUpsertInput,
} from "@xennic/shared";
import { PrismaService } from "../../infra/prisma/prisma.service.js";

/** مسیرهای SUPER_ADMIN (نوت ۳ §۴ — Super Admin API) */
@Injectable()
export class AdminService {
  public constructor(private readonly prisma: PrismaService) {}

  public async dashboard() {
    const [users, bills, calculations, articles, pendingEpc] = await Promise.all([
      this.prisma.client.user.count(),
      this.prisma.client.bill.count(),
      this.prisma.client.engineeringCalculation.count(),
      this.prisma.client.wikiArticle.count({ where: { status: "PUBLISHED" } }),
      this.prisma.client.epcRequest.count({ where: { status: "NEW" } }),
    ]);
    // aggregate/groupBy در Prisma خروجی ساخت‌یافته (و تایپ‌شده) می‌دهد؛ پس اینجا
    // assertion اضافه لازم نیست — با تایپ واقعی کلاینت، ESLint آن را زائد می‌داند.
    const wallet = await this.prisma.client.transaction.aggregate({
      _sum: { amount: true },
      where: { status: "SETTLED" },
    });

    const byRole = await this.prisma.client.user.groupBy({
      by: ["role"],
      _count: { _all: true },
    });

    return {
      totals: {
        users,
        bills,
        engineeringCalculations: calculations,
        publishedArticles: articles,
        pendingEpcRequests: pendingEpc,
        settledVolumeToman: wallet._sum?.amount ?? 0,
      },
      usersByRole: byRole.map((row) => ({ role: row.role, count: row._count._all })),
      adminRole: ROLES.superAdmin,
    };
  }

  public async transactions(page: number, pageSize: number) {
    const [items, total] = await this.prisma.client.$transaction([
      this.prisma.client.transaction.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          amount: true,
          type: true,
          status: true,
          provider: true,
          providerRef: true,
          createdAt: true,
          wallet: { select: { module: true, user: { select: { email: true } } } },
        },
      }),
      this.prisma.client.transaction.count(),
    ]);
    return { items, meta: { page, pageSize, total } };
  }

  /** CMS دانشنامه — ایجاد/ویرایش مقاله */
  public async upsertArticle(input: ArticleUpsertInput, authorId: string) {
    const data = {
      // slug در schema یکتاست و برای شاخه‌ی create الزامی؛ در update مقدارش تغییر نمی‌کند
      slug: input.slug,
      title: input.title,
      excerpt: input.excerpt ?? null,
      contentMdx: input.contentMdx,
      source: WIKI_SOURCE_BY_SLUG[input.source],
      status: input.published ? ("PUBLISHED" as const) : ("DRAFT" as const),
      tags: input.tags,
      authorId,
      publishedAt: input.published ? new Date() : null,
    };
    return this.prisma.client.wikiArticle.upsert({
      where: { slug: input.slug },
      update: data,
      create: data,
      select: { id: true, slug: true, status: true },
    });
  }

  // ─────────────── مدیریت کاتالوگ مدل‌های AI (دروازه‌ی چندمدلی) ───────────────

  /** GET /admin/ai-models — همه‌ی مدل‌ها (فعال و غیرفعال) برای مدیریت */
  public aiModels() {
    return this.prisma.client.aiModelCatalog.findMany({
      orderBy: [{ provider: "asc" }, { displayName: "asc" }],
    });
  }

  /** POST /admin/ai-models — ایجاد/ویرایش مدل (upsert بر اساس slug) */
  public async upsertAiModel(input: AiModelUpsertInput, actorId: string, ip?: string) {
    const saved = await this.prisma.client.aiModelCatalog.upsert({
      where: { slug: input.slug },
      update: input,
      create: input,
    });
    await this.logAdminAction(actorId, "ai-model.upsert", saved.slug, input, ip);
    return saved;
  }

  /** PATCH /admin/ai-models/:slug — تغییر جزئی (فعال/غیرفعال، قیمت و…) */
  public async patchAiModel(slug: string, input: AiModelPatchInput, actorId: string, ip?: string) {
    const existing = await this.prisma.client.aiModelCatalog.findUnique({ where: { slug } });
    if (!existing) throw new NotFoundException("مدل موردنظر در کاتالوگ یافت نشد");
    const saved = await this.prisma.client.aiModelCatalog.update({ where: { slug }, data: input });
    await this.logAdminAction(actorId, "ai-model.patch", slug, input, ip);
    return saved;
  }

  /** DELETE /admin/ai-models/:slug — حذف مدل از کاتالوگ */
  public async deleteAiModel(slug: string, actorId: string, ip?: string) {
    const existing = await this.prisma.client.aiModelCatalog.findUnique({ where: { slug } });
    if (!existing) throw new NotFoundException("مدل موردنظر در کاتالوگ یافت نشد");
    await this.prisma.client.aiModelCatalog.delete({ where: { slug } });
    await this.logAdminAction(actorId, "ai-model.delete", slug, null, ip);
    return { slug, deleted: true as const };
  }

  /** GET /admin/ai-stats — آمار مصرف دروازه‌ی AI (برای داشبورد ادمین) */
  public async aiStats() {
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);
    const weekStart = new Date(dayStart.getTime() - 6 * 24 * 3600 * 1000);

    const [todayCalls, weekCalls, jobsByStatus, byProvider, topModels] = await Promise.all([
      this.prisma.client.aiRequestLog.count({ where: { createdAt: { gte: dayStart } } }),
      this.prisma.client.aiRequestLog.count({ where: { createdAt: { gte: weekStart } } }),
      this.prisma.client.aiJob.groupBy({ by: ["status"], _count: { _all: true } }),
      this.prisma.client.aiRequestLog.groupBy({
        by: ["provider", "tier"],
        _count: { _all: true },
        _sum: { promptTokens: true, completionTokens: true },
        where: { createdAt: { gte: weekStart } },
      }),
      this.prisma.client.aiRequestLog.groupBy({
        by: ["model"],
        _count: { _all: true },
        where: { createdAt: { gte: weekStart } },
        orderBy: { _count: { model: "desc" } },
        take: 5,
      }),
    ]);

    return {
      calls: { today: todayCalls, last7Days: weekCalls },
      jobsByStatus: jobsByStatus.map((row) => ({ status: row.status, count: row._count._all })),
      byProvider: byProvider.map((row) => ({
        provider: row.provider,
        tier: row.tier,
        count: row._count._all,
        promptTokens: row._sum.promptTokens ?? 0,
        completionTokens: row._sum.completionTokens ?? 0,
      })),
      topModels: topModels.map((row) => ({ model: row.model, count: row._count._all })),
    };
  }

  /** ثبت اقدام مدیریتی در لاگ ممیزی (شکست لاگ، عملیات اصلی را خراب نمی‌کند) */
  private async logAdminAction(
    actorId: string,
    action: string,
    target: string,
    payload: unknown,
    ip?: string,
  ): Promise<void> {
    try {
      await this.prisma.client.adminAuditLog.create({
        data: {
          actorId,
          action,
          target,
          ip: ip ?? null,
          payload: payload === null ? undefined : (JSON.parse(JSON.stringify(payload)) as object),
        },
      });
    } catch {
      // ممیزی نباید مسیر اصلی را بشکند
    }
  }

  public auditLogs(take = 100) {
    return this.prisma.client.adminAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        action: true,
        target: true,
        ip: true,
        createdAt: true,
        actor: { select: { email: true } },
      },
    });
  }
}
