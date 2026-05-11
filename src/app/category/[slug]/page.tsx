import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Feed } from "@/components/feed";
import { FeedFilters } from "@/components/filters";
import { Badge, SectionHeader } from "@/components/ui/primitives";
import { getByCategory, getCategories } from "@/lib/queries";
import { getGuidesForCategory } from "@/lib/guides";

export const revalidate = 600;

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const cats = await getCategories();
  const c = cats.find((x) => x.slug === params.slug);
  if (!c) return { title: "Category" };
  return {
    title: `${c.name} の最新記事`,
    description: c.description ?? `${c.name} のキュレーション記事。`,
    alternates: { canonical: `/category/${c.slug}` },
  };
}

export default async function CategoryPage({
  params, searchParams,
}: { params: { slug: string }; searchParams: { sort?: string } }) {
  const cats = await getCategories();
  const cat = cats.find((c) => c.slug === params.slug);
  if (!cat) notFound();
  const sort = (searchParams.sort === "fresh" ? "fresh" : "score") as "fresh" | "score";
  const items = await getByCategory(params.slug, { limit: 60, sort });
  const guides = getGuidesForCategory(params.slug);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-screen-2xl px-4 py-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge tone="accent">CATEGORY</Badge>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tightish">{cat.name}</h1>
            {cat.description ? <p className="mt-1 text-sm text-ink-muted">{cat.description}</p> : null}
          </div>
          <FeedFilters categories={cats} />
        </div>
        {guides.length > 0 && (
          <section className="mb-10">
            <SectionHeader tag="GUIDE" title="編集部の選び方ガイド" accessory={guides.length === 1 ? "1 本" : `${guides.length} 本`} />
            <div className="grid gap-3 sm:grid-cols-2">
              {guides.map((g) => (
                <Link
                  key={g.frontmatter.slug}
                  href={`/guide/${g.frontmatter.slug}`}
                  className="group flex flex-col gap-2 rounded-xl border border-accent/30 bg-gradient-to-br from-accent/10 via-bg-soft to-bg p-5 transition hover:border-accent/60"
                >
                  <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-accent">
                    GUIDE · {g.frontmatter.publishedAt}
                  </div>
                  <div className="font-display text-base md:text-lg font-semibold leading-snug tracking-tightish text-ink group-hover:text-accent line-clamp-2">
                    {g.frontmatter.title}
                  </div>
                  <p className="text-xs text-ink-soft line-clamp-2">{g.frontmatter.description}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <SectionHeader tag={params.slug.toUpperCase()} title={sort === "fresh" ? "新着順" : "スコア順"} accessory={`${items.length} 件`} />
        <Feed items={items} columns={3} />
      </main>
      <Footer />
    </>
  );
}
