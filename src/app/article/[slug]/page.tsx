import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { ArticleCard } from "@/components/article-card";
import { Badge, Hr, Pill, SectionHeader } from "@/components/ui/primitives";
import { getArticleBySlug, getRelatedArticles, getSameSourceArticles } from "@/lib/queries";
import { createSupabaseServer } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/utils";

export const revalidate = 900;

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const a = await getArticleBySlug(params.slug);
  if (!a) return { title: "Article" };
  return {
    title: a.title,
    description: a.short_summary ?? a.editorial_note ?? undefined,
    alternates: { canonical: `/article/${a.slug}` },
    openGraph: { title: a.title, description: a.short_summary ?? undefined, images: a.thumbnail_url ? [a.thumbnail_url] : [] },
  };
}

export default async function ArticleDetail({ params }: { params: { slug: string } }) {
  const a = await getArticleBySlug(params.slug);
  if (!a) notFound();

  const [related, sameSource, tagRows] = await Promise.all([
    getRelatedArticles(a, 6),
    getSameSourceArticles(a, 6),
    (async () => {
      const supabase = createSupabaseServer();
      const { data } = await supabase
        .from("article_tags")
        .select("tags(slug,name,kind)")
        .eq("article_id", a.id);
      return (data ?? []).map((r: any) => r.tags).filter(Boolean);
    })(),
  ]);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-screen-xl px-4 py-8 lg:px-8">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-[12px] text-ink-muted">
          <Link href="/" className="hover:text-ink">Home</Link>
          <span>/</span>
          {a.category_slug ? (
            <>
              <Link href={`/category/${a.category_slug}`} className="hover:text-ink">{a.category_name}</Link>
              <span>/</span>
            </>
          ) : null}
          <span className="text-ink line-clamp-1">{a.title}</span>
        </nav>

        <article className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {a.is_featured ? <Badge tone="accent">FEATURED</Badge> : null}
              {a.category_slug ? (
                <Link href={`/category/${a.category_slug}`}>
                  <Pill className="hover:border-accent/40 hover:text-ink">{a.category_name}</Pill>
                </Link>
              ) : null}
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                {a.published_at ? new Date(a.published_at).toISOString().slice(0,16).replace("T"," ") : ""} · {timeAgo(a.published_at)}
              </span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tightish leading-[1.15]">{a.title}</h1>

            {a.thumbnail_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.thumbnail_url} alt={a.title} className="mt-6 w-full rounded-xl border border-ink-line object-cover" />
            ) : null}

            <div className="mt-6 rounded-xl border border-ink-line bg-bg-soft p-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent mb-2">要約</div>
              <p className="text-base text-ink-soft leading-relaxed">{a.short_summary || "要約はありません。"}</p>
            </div>

            {a.editorial_note ? (
              <div className="mt-4 rounded-xl border border-accent/30 bg-accent/5 p-5">
                <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent mb-2">編集部コメント</div>
                <p className="text-sm text-ink leading-relaxed">{a.editorial_note}</p>
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-bg hover:bg-accent-hover"
              >
                {a.source_name} で原文を読む <ArrowUpRight size={16} />
              </a>
              {a.source_slug ? (
                <Link href={`/source/${a.source_slug}`} className="text-sm text-ink-soft hover:text-ink">
                  {a.source_name} の他の記事 →
                </Link>
              ) : null}
            </div>

            {tagRows.length > 0 && (
              <div className="mt-8">
                <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-ink-muted mb-2">タグ</div>
                <div className="flex flex-wrap gap-2">
                  {tagRows.map((t: any) => (
                    <Link key={t.slug} href={`/tag/${t.slug}`}>
                      <Pill className="hover:border-accent/40 hover:text-ink">#{t.name}</Pill>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <Hr className="my-10" />

            <p className="text-xs text-ink-muted">
              このページは短い要約と外部リンクのみを掲載しています。本文は転載していません。© {a.source_name}.
            </p>
          </div>

          <aside className="space-y-10">
            <div>
              <SectionHeader tag="RELATED" title="同じカテゴリ" />
              <div className="grid gap-3">
                {related.length === 0 ? (
                  <p className="text-sm text-ink-muted">関連記事はまだありません。</p>
                ) : related.map((r) => <ArticleCard key={r.id} a={r} kind="compact" />)}
              </div>
            </div>
            <div>
              <SectionHeader tag="SOURCE" title={`${a.source_name || "このソース"} の他の記事`} />
              <div className="grid gap-3">
                {sameSource.length === 0 ? (
                  <p className="text-sm text-ink-muted">このソースの他の記事はまだありません。</p>
                ) : sameSource.map((r) => <ArticleCard key={r.id} a={r} kind="compact" />)}
              </div>
            </div>
          </aside>
        </article>
      </main>
      <Footer />
    </>
  );
}
