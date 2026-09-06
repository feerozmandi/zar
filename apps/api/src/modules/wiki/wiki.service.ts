import type { Queue as BullQueue } from "bullmq";
import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { QUEUES, WIKI_SOURCE_BY_SLUG, type WikiSourceEnum, type WikiSources } from "@xennic/shared";
import { PrismaService } from "../../infra/prisma/prisma.service.js";

/**
 * دانشنامه (نوت ۳ §۴ — Wiki & Knowledge Base API).
 * جستجو روی فیلدهای متنی انجام می‌شود؛ index کامل‌تر (tsvector) در فاز ۴ افزوده می‌شود.
 */
@Injectable()
export class WikiService {
  public constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUES.wikiIndex) private readonly indexQueue: BullQueue,
    @InjectQueue(QUEUES.aiRequest) private readonly aiQueue: BullQueue,
  ) {}

  public async articles(page: number, pageSize: number, source?: WikiSources) {
    // منبع از API با اسلاگ می‌آید و باید به نام enum در دیتابیس نگاشت شود
    const where: { status: "PUBLISHED"; source?: WikiSourceEnum } = { status: "PUBLISHED" };
    if (source) where.source = WIKI_SOURCE_BY_SLUG[source];
    const [items, total] = await this.prisma.client.$transaction([
      this.prisma.client.wikiArticle.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { publishedAt: "desc" },
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          source: true,
          tags: true,
          publishedAt: true,
          category: { select: { slug: true, title: true } },
        },
      }),
      this.prisma.client.wikiArticle.count({ where }),
    ]);
    return { items, meta: { page, pageSize, total } };
  }

  public async search(q: string, take = 20) {
    return this.prisma.client.wikiArticle.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { contentMdx: { contains: q, mode: "insensitive" } },
          { tags: { has: q } },
        ],
      },
      take,
      select: { id: true, slug: true, title: true, excerpt: true, source: true },
    });
  }

  public async bySlug(slug: string) {
    return this.prisma.client.wikiArticle.findUnique({
      where: { slug },
      include: {
        category: { select: { slug: true, title: true } },
        revisions: {
          take: 5,
          orderBy: { createdAt: "desc" },
          select: { id: true, createdAt: true, note: true },
        },
      },
    });
  }

  /** POST /wiki/ask-ai — پرسش تخصصی روی قوانین (پاسخ در صف AI تولید می‌شود) */
  public async askAi(
    userId: string,
    question: string,
    articleIds: string[],
    model?: string,
    temperature = 0.2,
  ) {
    const job = await this.aiQueue.add("wiki-ask", {
      userId,
      question,
      articleIds,
      model,
      temperature,
      retrieval: "wiki",
    });
    await this.indexQueue.add("touch", { articleIds });
    return { jobId: job.id, status: "QUEUED" as const, queue: QUEUES.aiRequest };
  }
}
