import { z } from "zod";
import { apiFetch } from "@/lib/api-client";
import { SiteHeader } from "../_components/layout/site-header";
import { WikiSearch } from "../_components/wiki/wiki-search";

const listSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      slug: z.string(),
      title: z.string(),
      excerpt: z.string().nullable().optional(),
      source: z.string(),
      tags: z.array(z.string()).default([]),
    }),
  ),
});

export const revalidate = 300;

/** دانشنامه — ISR برای سئو + جستجو از API */
export default async function WikiIndexPage() {
  let articles: z.infer<typeof listSchema>["items"] = [];
  try {
    const data = await apiFetch("wiki/articles", listSchema, { next: { revalidate: 300 } });
    articles = data.items;
  } catch {
    articles = [];
  }

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-4 py-12 lg:px-8">
        <h1 className="text-3xl font-black">دانشنامه و مرجع قوانین برق</h1>
        <p className="mt-3 text-muted-foreground">
          مقررات ملی ساختمان (مبحث ۱۳)، نشریه ۱۱۰ و آیین‌نامه‌های توانیر — با جستجوی متنی و پرسش از هوش
          مصنوعی.
        </p>
        <WikiSearch />

        {articles.length === 0 ? (
          <p className="mt-10 rounded-(--radius-card) border border-dashed border-border p-6 text-sm text-muted-foreground">
            هنوز محتوایی منتشر نشده یا هسته‌ی API در دسترس نیست (فایل `.env` و اجرای apps/api را بررسی کنید).
          </p>
        ) : (
          <ul className="mt-10 grid gap-4">
            {articles.map((article) => (
              <li className="rounded-(--radius-card) border border-border p-5" key={article.id}>
                <a className="text-lg font-bold hover:text-primary" href={`/wiki/${article.slug}`}>
                  {article.title}
                </a>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{article.excerpt}</p>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
