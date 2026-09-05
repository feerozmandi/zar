/**
 * Seed اولیه‌ی فاز ۱: نقش‌ها، نرخ‌های نمونه‌ی تعرفه، مدل‌های AI و چند مقاله‌ی دانشنامه.
 * اجرا: pnpm db:seed   (نیازمند DATABASE_URL معتبر)
 */
import { hashPassword } from "@xennic/shared";
import { createPrismaClient } from "../src/client.js";

const prisma = createPrismaClient(["error"]);

async function main(): Promise<void> {
  // ۱) مدل‌های فعال دروازه‌ی AI
  const models = [
    { slug: "gpt-4o", provider: "OPENAI", displayName: "GPT-4o", supportsVision: true, maxTokens: 16384 },
    {
      slug: "claude-3-5-sonnet",
      provider: "ANTHROPIC",
      displayName: "Claude 3.5 Sonnet",
      supportsVision: true,
      maxTokens: 8192,
    },
    {
      slug: "llama-3.3-70b",
      provider: "GITHUB_MODELS",
      displayName: "Llama 3.3 70B (GitHub Models)",
      supportsVision: false,
      maxTokens: 8192,
      freeTierOnly: true,
    },
  ] as const;

  for (const model of models) {
    await prisma.aiModelCatalog.upsert({
      where: { slug: model.slug },
      update: { ...model, provider: model.provider },
      create: { ...model, provider: model.provider },
    });
  }

  // ۲) نرخ نمونه‌ی تعرفه‌ی صنعتی (جایگزین مقدار hard-coded در کد)
  await prisma.tariffRate.upsert({
    where: { id: "seed-tariff-industrial-1" },
    update: {},
    create: {
      id: "seed-tariff-industrial-1",
      tariffType: "INDUSTRIAL",
      segmentName: "میان‌باری",
      minUnits: 0,
      unitPrice: 3500,
      penaltyPercent: 0,
      demandPrice: 22000,
      reactiveThreshold: 0.9,
      effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
      sourceRef: "آیین‌نامه تعرفه‌های برق ۱۴۰۵ — توانیر",
      isActive: true,
    },
  });

  // ۳) دسته‌بندی‌های دانشنامه
  const categories = [
    { slug: "mabhas-13", title: "مقررات ملی ساختمان — مبحث ۱۳" },
    { slug: "neghsh-110", title: "نشریه ۱۱۰ — محاسبات تأسیسات الکتریکی" },
    { slug: "tavanir", title: "آیین‌نامه‌ها و بخشنامه‌های توانیر" },
  ];

  const categoryIds = new Map<string, string>();
  for (const [order, category] of categories.entries()) {
    const saved = await prisma.wikiCategory.upsert({
      where: { slug: category.slug },
      update: { title: category.title, order },
      create: { slug: category.slug, title: category.title, order },
    });
    categoryIds.set(category.slug, saved.id);
  }

  // ۴) کاربر نمونه‌ی مدیر (رمز عبور پیش‌فرض فقط برای محیط توسعه)
  const admin = await prisma.user.upsert({
    where: { email: "admin@xennic.ir" },
    update: {},
    create: {
      email: "admin@xennic.ir",
      fullName: "مدیر سامانه Xennic",
      passwordHash: await hashPassword("Xennic@2026!"),
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
  });

  // ۵) یک مقاله‌ی نمونه برای راستی‌آزمایی مسیر /wiki
  await prisma.wikiArticle.upsert({
    where: { slug: "max-voltage-drop-limits" },
    update: {},
    create: {
      slug: "max-voltage-drop-limits",
      title: "حد مجاز افت ولتاژ در نشریه ۱۱۰ و مبحث ۱۳",
      excerpt: "جدول ضرایب مجاز افت ولتاژ برای مدارهای تغذیه‌ای و روشنایی + روش محاسبه.",
      contentMdx:
        "## ضوابط\n\nافت ولتاژ در مدارهای تغذیه‌ای حداکثر ۴٪ و در مدارهای روشنایی حداکثر ۳٪ مجاز است.\n\n> منبع: نشریه ۱۱۰، مبحث ۱۳ مقررات ملی ساختمان",
      source: "PUBLICATION_110",
      status: "PUBLISHED",
      publishedAt: new Date(),
      authorId: admin.id,
      categoryId: categoryIds.get("neghsh-110"),
      tags: ["افت ولتاژ", "نشریه ۱۱۰"],
    },
  });

  console.info("✅ Seed کامل شد:", { models: models.length, categories: categories.length });
}

main()
  .catch((error: unknown) => {
    console.error("❌ Seed ناموفق بود:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
