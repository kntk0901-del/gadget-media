import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Feed } from "@/components/feed";
import { Badge, SectionHeader } from "@/components/ui/primitives";
import { getFeaturedArticles, getTopArticles } from "@/lib/queries";

export const revalidate = 300;
export const metadata = {
  title: "今日のピックアップ — 編集部選",
  description: "編集部が選ぶ、今日のハードガジェット注目記事。",
};

export default async function FeaturedPage() {
  const [featured, top] = await Promise.all([
    getFeaturedArticles(8),
    getTopArticles(30),
  ]);
  const rest = top.filter((a) => !featured.find((f) => f.id === a.id));

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-screen-2xl px-4 py-6 lg:px-8">
        <div className="mb-8">
          <Badge tone="accent">PICKS</Badge>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tightish">今日のピックアップ</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-muted">
            編集スコアと人手チェックでキュレーションした、本日のハードガジェット注目記事。
          </p>
        </div>

        {featured.length > 0 && (
          <section className="mb-12">
            <SectionHeader tag="A // FEATURED" title="ピックアップ" />
            <Feed items={featured} columns={3} />
          </section>
        )}

        <section>
          <SectionHeader tag="B // TOP SCORED" title="直近 72 時間のスコア上位" />
          <Feed items={rest} columns={3} />
        </section>
      </main>
      <Footer />
    </>
  );
}
