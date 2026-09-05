import { Injectable } from "@nestjs/common";
import { ROLES, type ArticleUpsertInput } from "@xennic/shared";
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
