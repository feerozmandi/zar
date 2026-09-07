import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../_components/layout/site-header";

interface ArticlePayload {
  slug: string;
  title: string;
  contentMdx: string;
}

async function loadArticle(slug: string): Promise<ArticlePayload | null> {
  try {
    const response = await fetch(
      `${process.env.API_INTERNAL_URL ?? "http://localhost:4000/api/v1"}/wiki/${slug}`,
      {
        next: { revalidate: 300 },
      },
    );
    if (!response.ok) return null;
    const payload = (await response.json()) as { data?: ArticlePayload };
    return payload.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await loadArticle(slug);
  return { title: article?.title ?? slug };
}

/** صفحه مقاله دانشنامه (SSG/ISR بر اساس slug) */
export default async function WikiArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await loadArticle(slug);
  if (!article) notFound();

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-4 py-12 lg:px-8">
        <Link className="text-sm text-muted-foreground hover:text-primary" href="/wiki">
          ← بازگشت به دانشنامه
        </Link>
        <h1 className="mt-6 text-3xl font-black">{article.title}</h1>
        <article className="prose-invert mt-6 whitespace-pre-wrap leading-9 text-muted-foreground">
          {article.contentMdx}
        </article>
      </main>
    </div>
  );
}
