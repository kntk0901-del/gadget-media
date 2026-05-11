import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Feed } from "@/components/feed";
import { Badge } from "@/components/ui/primitives";
import { searchArticles } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "検索",
  description: "キュレーションされたガジェット記事を検索。",
  robots: { index: false },
};

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams.q || "").trim();
  const items = q ? await searchArticles(q, 60) : [];

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-screen-2xl px-4 py-6 lg:px-8">
        <div className="mb-8">
          <Badge tone="accent">SEARCH</Badge>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tightish">{q ? `「${q}」の検索結果` : "検索"}</h1>
          <p className="mt-1 text-sm text-ink-muted">{q ? `${items.length} 件ヒット` : "ブランド名・モデル名・トピックで検索"}</p>
        </div>

        <form action="/search" className="mb-8 flex gap-2">
          <input name="q" defaultValue={q} placeholder="例: Anker GaN、Pixel 10、ロボット掃除機…"
                 className="flex-1 rounded-full border border-ink-line bg-bg-soft px-4 py-2 text-sm focus:outline-none focus:border-accent/60" />
          <button className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-bg hover:bg-accent-hover">検索</button>
        </form>

        <Feed items={items} columns={3} />
      </main>
      <Footer />
    </>
  );
}
