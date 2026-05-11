import Link from "next/link";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "GADGET//WIRE";

const CATEGORIES = [
  { slug: "smartphones", label: "スマートフォン" },
  { slug: "charging",    label: "スマホ周辺機器" },
  { slug: "appliances",  label: "家電" },
  { slug: "wearables",   label: "ウェアラブル" },
  { slug: "ebikes",      label: "e-bike" },
  { slug: "other",       label: "その他ガジェット" },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-ink-line bg-bg-soft">
      <div className="mx-auto grid max-w-screen-2xl gap-10 px-4 py-12 lg:grid-cols-4 lg:px-8">
        <div>
          <div className="font-display text-xl font-bold tracking-tightish">{SITE_NAME}</div>
          <p className="mt-3 max-w-xs text-sm text-ink-muted">
            毎日キュレーションされる、ハードガジェット好きのためのフィード。要約とリンクのみ、原文はオリジナル媒体へ。
          </p>
        </div>
        <div>
          <h4 className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent mb-3">Categories</h4>
          <ul className="space-y-1.5 text-sm">
            {CATEGORIES.map((c) => (
              <li key={c.slug}><Link href={`/category/${c.slug}`} className="text-ink-soft hover:text-ink">{c.label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent mb-3">Explore</h4>
          <ul className="space-y-1.5 text-sm">
            <li><Link href="/latest" className="text-ink-soft hover:text-ink">最新記事</Link></li>
            <li><Link href="/featured" className="text-ink-soft hover:text-ink">今日のピックアップ</Link></li>
            <li><Link href="/search" className="text-ink-soft hover:text-ink">検索</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent mb-3">About</h4>
          <p className="text-xs text-ink-muted leading-relaxed">
            記事内容の権利はすべて元媒体に帰属します。本サイトは要約と外部リンクのみを掲載し、本文は転載しません。
          </p>
        </div>
      </div>
      <div className="border-t border-ink-line">
        <div className="mx-auto max-w-screen-2xl px-4 py-4 text-[11px] text-ink-muted flex justify-between lg:px-8 font-mono">
          <span>© {new Date().getFullYear()} {SITE_NAME}</span>
          <span>BUILD · {new Date().toISOString().slice(0,10)}</span>
        </div>
      </div>
    </footer>
  );
}
