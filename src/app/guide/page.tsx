import Link from "next/link";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Badge, Pill, SectionHeader } from "@/components/ui/primitives";
import { getAllGuides } from "@/lib/guides";

export const revalidate = 3600;

export const metadata = {
  title: "スマホ選び・ガジェット選び方ガイド",
  description: "編集部による比較・選び方ガイド。ハイエンドスマホ、充電器、ウェアラブルなど、買う前に読みたい長文レビュー。",
  alternates: { canonical: "/guide" },
};

export default function GuideIndex() {
  const guides = getAllGuides();
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-screen-2xl px-4 py-8 lg:px-8">
        <div className="mb-10">
          <Badge tone="accent">GUIDES</Badge>
          <h1 className="mt-2 font-display text-3xl md:text-4xl font-bold tracking-tightish">選び方ガイド</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-muted leading-relaxed">
            編集部による比較・選び方の長文ガイド。買う前の比較検討に。
          </p>
        </div>

        <SectionHeader tag="ALL" title="全ガイド" accessory={`${guides.length} 本`} />

        {guides.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ink-line bg-bg-soft p-12 text-center text-ink-muted">
            まだガイドはありません。
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {guides.map((g) => (
              <Link
                key={g.frontmatter.slug}
                href={`/guide/${g.frontmatter.slug}`}
                className="group flex flex-col gap-3 rounded-xl border border-ink-line bg-bg-soft p-6 transition hover:border-accent/40 hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-2 text-[11px] text-ink-muted">
                  <Badge tone="accent">GUIDE</Badge>
                  <span className="font-mono">{g.frontmatter.publishedAt}</span>
                </div>
                <h2 className="font-display text-xl font-semibold leading-snug tracking-tightish text-ink group-hover:text-accent line-clamp-3">
                  {g.frontmatter.title}
                </h2>
                <p className="text-sm text-ink-soft leading-relaxed line-clamp-3">{g.frontmatter.description}</p>
                {g.frontmatter.tags && g.frontmatter.tags.length > 0 && (
                  <div className="mt-auto flex flex-wrap gap-1 pt-3 border-t border-ink-line">
                    {g.frontmatter.tags.slice(0, 5).map((t) => (
                      <Pill key={t}>{t}</Pill>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
