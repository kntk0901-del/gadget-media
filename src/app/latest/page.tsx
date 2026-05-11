import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Feed } from "@/components/feed";
import { Badge, SectionHeader } from "@/components/ui/primitives";
import { FeedFilters } from "@/components/filters";
import { getCategories, getLatestArticles, getByCategory } from "@/lib/queries";

export const revalidate = 300;
export const metadata = {
  title: "最新記事 — すべての新着",
  description: "全ソース横断、新着順のガジェット記事フィード。",
};

export default async function LatestPage({ searchParams }: { searchParams: { cat?: string; sort?: string } }) {
  const cats = await getCategories();
  const sort = (searchParams.sort === "fresh" ? "fresh" : "score") as "fresh" | "score";
  const items = searchParams.cat
    ? await getByCategory(searchParams.cat, { limit: 60, sort })
    : await getLatestArticles(60);

  const catLabel = searchParams.cat ? cats.find(c => c.slug === searchParams.cat)?.name : null;

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-screen-2xl px-4 py-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge tone="accent">FEED</Badge>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tightish">最新記事</h1>
            <p className="mt-1 text-sm text-ink-muted">毎日更新される、全ソース横断の新着フィード。</p>
          </div>
          <FeedFilters categories={cats} />
        </div>
        <SectionHeader tag="ALL" title={catLabel ? `カテゴリ: ${catLabel}` : "すべてのソース"} accessory={`${items.length} 件`} />
        <Feed items={items} columns={3} />
      </main>
      <Footer />
    </>
  );
}
