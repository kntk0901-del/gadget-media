import Link from "next/link";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { ArticleCard } from "@/components/article-card";
import { CompactList, Feed } from "@/components/feed";
import { Badge, SectionHeader } from "@/components/ui/primitives";
import {
  getCategories, getFeaturedArticles, getLatestArticles, getTopArticles, getByCategory,
} from "@/lib/queries";

export const revalidate = 600;

export default async function HomePage() {
  const [cats, featured, top, latest] = await Promise.all([
    getCategories(),
    getFeaturedArticles(5),
    getTopArticles(18),
    getLatestArticles(12),
  ]);

  const [phones, charging, appliances, wearables, ebikes, smarthome, robotics, tech, other] = await Promise.all([
    getByCategory("smartphones", { limit: 6 }),
    getByCategory("charging",    { limit: 6 }),
    getByCategory("appliances",  { limit: 6 }),
    getByCategory("wearables",   { limit: 6 }),
    getByCategory("ebikes",      { limit: 6 }),
    getByCategory("smarthome",   { limit: 4 }),
    getByCategory("robotics",    { limit: 4 }),
    getByCategory("tech",        { limit: 4 }),
    getByCategory("other",       { limit: 6 }),
  ]);

  // Merge featured (manual/auto pinned) with the top-scored set, keeping
  // featured items first and deduping by id. This becomes our single
  // "今日のピックアップ" pool — there is no separate hero / top split.
  const pickPool = [
    ...featured,
    ...top.filter((t) => !featured.some((f) => f.id === t.id)),
  ];
  const lead = pickPool[0];
  const subPicks = pickPool.slice(1, 9); // 8 picks below the lead (2 rows × 4)

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-screen-2xl px-4 py-6 lg:px-8 bg-grid">
        {/* TODAY'S PICKS (lead + 8 subs, merged hero) */}
        <section className="mb-14">
          <div className="mb-4 flex items-center gap-3">
            <Badge tone="accent">TODAY · {new Date().toISOString().slice(0,10)}</Badge>
            <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-ink-muted">今日のピックアップ</span>
            <span className="ml-auto">
              <Link href="/featured" className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted hover:text-accent">
                もっと見る →
              </Link>
            </span>
          </div>

          {lead ? (
            <>
              <div className="mb-4">
                <HeroCard a={lead} />
              </div>
              {subPicks.length > 0 && (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                  {subPicks.map((a) => <ArticleCard key={a.id} a={a} />)}
                </div>
              )}
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-ink-line bg-bg-soft p-12 text-center text-ink-muted">
              まもなく記事が届きます…
            </div>
          )}
        </section>

        {/* PRIMARY CATEGORIES */}
        <CategoryStrip title="スマートフォン"     slug="smartphones" items={phones}     tag="01" />
        <CategoryStrip title="スマホ周辺機器"      slug="charging"    items={charging}   tag="02" />
        <CategoryStrip title="家電"               slug="appliances"  items={appliances} tag="03" />
        <CategoryStrip title="ウェアラブル"        slug="wearables"   items={wearables}  tag="04" />
        <CategoryStrip title="e-bike・モビリティ"  slug="ebikes"      items={ebikes}     tag="05" />
        <CategoryStrip title="その他ガジェット"    slug="other"       items={other}      tag="06" />

        {/* LATEST + SIDE */}
        <section className="mb-16 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SectionHeader
              tag="07 // LATEST"
              title="最新記事"
              accessory={<Link href="/latest" className="hover:text-accent">すべて見る →</Link>}
            />
            <Feed items={latest} columns={2} />
          </div>
          <aside className="space-y-8">
            <div>
              <SectionHeader tag="08" title="スマートホーム" accessory={<Link href="/category/smarthome" className="hover:text-accent">もっと →</Link>} />
              <CompactList items={smarthome} />
            </div>
            <div>
              <SectionHeader tag="09" title="ロボティクス" accessory={<Link href="/category/robotics" className="hover:text-accent">もっと →</Link>} />
              <CompactList items={robotics} />
            </div>
            <div>
              <SectionHeader tag="10" title="技術・素材" accessory={<Link href="/category/tech" className="hover:text-accent">もっと →</Link>} />
              <CompactList items={tech} />
            </div>
          </aside>
        </section>

        {/* TAXONOMY */}
        <section className="mb-10">
          <SectionHeader tag="∞" title="すべてのカテゴリ" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {cats.map((c) => (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                className="group flex items-center justify-between rounded-xl border border-ink-line bg-bg-soft px-4 py-3 transition hover:border-accent/40"
              >
                <div>
                  <div className="font-display text-sm font-semibold text-ink group-hover:text-accent">{c.name}</div>
                  {c.description ? <div className="text-[11px] text-ink-muted line-clamp-1">{c.description}</div> : null}
                </div>
                <span className="font-mono text-[10px] text-ink-muted">P{c.priority}</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function CategoryStrip({ title, slug, items, tag }: { title: string; slug: string; items: any[]; tag: string }) {
  if (!items.length) return null;
  return (
    <section className="mb-12">
      <SectionHeader
        tag={`${tag} // ${slug.toUpperCase()}`}
        title={title}
        accessory={<Link href={`/category/${slug}`} className="hover:text-accent">もっと →</Link>}
      />
      <Feed items={items} columns={3} />
    </section>
  );
}

/** Full-width editorial hero card. Image left, big title right. */
function HeroCard({ a }: { a: any }) {
  return (
    <article className="group relative grid gap-0 overflow-hidden rounded-2xl border border-ink-line bg-bg-soft shadow-card transition hover:border-accent/40 lg:grid-cols-2">
      <Link href={`/article/${a.slug}`} className="block">
        {a.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={a.thumbnail_url} alt={a.title} className="h-64 lg:h-80 w-full object-cover lg:border-r border-b lg:border-b-0 border-ink-line" loading="eager" />
        ) : (
          <div className="h-64 lg:h-80 w-full bg-gradient-to-br from-bg-elev via-bg-soft to-bg flex items-center justify-center lg:border-r border-b lg:border-b-0 border-ink-line">
            <div className="font-mono text-[10px] tracking-[0.3em] text-ink-muted">NO IMAGE</div>
          </div>
        )}
      </Link>
      <div className="flex flex-col justify-center gap-4 p-6 lg:p-10">
        <div className="flex flex-wrap items-center gap-2">
          {a.is_featured ? <Badge tone="accent">FEATURED</Badge> : <Badge tone="accent">LEAD</Badge>}
          {a.category_slug ? (
            <Link href={`/category/${a.category_slug}`} className="rounded-full border border-ink-line bg-bg-elev px-2.5 py-0.5 text-[11px] text-ink-soft hover:border-accent/40 hover:text-ink">
              {a.category_name}
            </Link>
          ) : null}
          <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.2em] text-ink-muted">
            {a.published_at ? new Date(a.published_at).toISOString().slice(0,10) : ""}
          </span>
        </div>
        <Link href={`/article/${a.slug}`} className="block">
          <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold leading-tight tracking-tightish text-ink group-hover:text-accent line-clamp-3">
            {a.title}
          </h2>
        </Link>
        {a.short_summary ? (
          <p className="text-sm text-ink-soft leading-relaxed line-clamp-3">{a.short_summary}</p>
        ) : null}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-ink-line">
          <div className="text-[11px] text-ink-muted">
            {a.source_slug ? (
              <Link href={`/source/${a.source_slug}`} className="hover:text-ink">{a.source_name}</Link>
            ) : "—"}
          </div>
          <a
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-[11px] font-medium text-bg hover:bg-accent-hover"
          >
            原文を読む ↗
          </a>
        </div>
      </div>
    </article>
  );
}
