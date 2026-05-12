import type { GuidePhone } from "@/lib/guides";

/**
 * Editorial hero banner: large real photo with strong overlay typography.
 * Uses a remote image (Unsplash, press kit, etc.) when frontmatter provides
 * one, otherwise a brand-color gradient background.
 */
export function GuideHero({
  title,
  subtitle,
  date,
  phones = [],
  heroImage,
}: {
  title: string;
  subtitle?: string;
  date?: string;
  phones?: GuidePhone[];
  heroImage?: string;
}) {
  return (
    <div className="relative -mx-4 lg:mx-0 mb-12 overflow-hidden rounded-2xl border border-ink-line bg-bg-elev">
      {/* background photo or gradient */}
      <div className="absolute inset-0">
        {heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroImage}
            alt=""
            className="h-full w-full object-cover"
            loading="eager"
            fetchPriority="high"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-bg-elev via-bg-soft to-bg" />
        )}
        {/* gradient mask for legibility */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(110deg, rgba(10,10,12,0.92) 0%, rgba(10,10,12,0.78) 45%, rgba(10,10,12,0.25) 100%)",
          }}
        />
      </div>

      {/* content */}
      <div className="relative px-6 py-12 lg:px-14 lg:py-20 max-w-3xl">
        {date ? (
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-bg/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.28em] text-accent backdrop-blur-sm">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent animate-pulse2" />
            EDITORIAL · {date}
          </div>
        ) : null}
        <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold leading-[1.08] tracking-tightish text-white drop-shadow">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-5 max-w-2xl text-base lg:text-lg text-white/85 leading-relaxed drop-shadow">{subtitle}</p>
        ) : null}
        {phones.length > 0 ? (
          <div className="mt-7 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/60">
              比較対象
            </span>
            {phones.slice(0, 6).map((p) => (
              <span
                key={p.name}
                className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] text-white/95 backdrop-blur-sm"
              >
                {p.name}
              </span>
            ))}
            {phones.length > 6 ? (
              <span className="text-[11px] text-white/60">+{phones.length - 6} 機種</span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
