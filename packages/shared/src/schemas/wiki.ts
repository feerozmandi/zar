import { z } from "zod";

export const wikiSources = [
  "national-building-regulation-13",
  "publication-110",
  "tavanir-rules",
  "iec",
  "blog",
] as const;

export const articleSearchSchema = z.object({
  q: z.string().min(1).max(200),
  source: z.enum(wikiSources).optional(),
  ...paginationLike(),
});

function paginationLike() {
  return {
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(10),
  };
}

export const articleUpsertSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]{3,120}$/),
  title: z.string().min(3).max(200),
  excerpt: z.string().max(500).optional(),
  contentMdx: z.string().min(1),
  source: z.enum(wikiSources),
  published: z.boolean().default(false),
  tags: z.array(z.string().min(1).max(40)).max(20).default([]),
});

export const askAiSchema = z.object({
  question: z.string().min(5).max(4000),
  articleIds: z.array(z.string()).max(20).default([]),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).default(0.2),
});

export type WikiSources = (typeof wikiSources)[number];

/**
 * اسلاگ‌های عمومی (`blog`) با نام عضو enum در Prisma (`COMPANY_BLOG`) فرق دارند؛
 * این نگاشت تنها پل رسمی بین قرارداد API و دیتابیس است (نوت ۳ §۴).
 */
export const WIKI_SOURCE_BY_SLUG = {
  "national-building-regulation-13": "NATIONAL_REGULATION_13",
  "publication-110": "PUBLICATION_110",
  "tavanir-rules": "TAVANIR_RULES",
  iec: "IEC",
  blog: "COMPANY_BLOG",
} as const satisfies Record<WikiSources, string>;

export type WikiSourceEnum = (typeof WIKI_SOURCE_BY_SLUG)[keyof typeof WIKI_SOURCE_BY_SLUG];
export type WikiSearchInput = z.infer<typeof articleSearchSchema>;
export type AskAiInput = z.infer<typeof askAiSchema>;
export type ArticleUpsertInput = z.infer<typeof articleUpsertSchema>;
