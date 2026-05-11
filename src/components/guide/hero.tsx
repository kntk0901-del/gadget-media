import type { GuidePhone } from "@/lib/guides";
import { PhoneSvg } from "./phone-svg";

/**
 * Editorial hero banner for the guide. Shows up to 5 phones as stylized
 * silhouettes on a brand-colored background — heavy first impression,
 * zero copyrighted imagery.
 */
export function GuideHero({
  title,
  subtitle,
  date,
  phones = [],
}: {
  title: string;
  subtitle?: string;
  date?: string;
  phones?: GuidePhone[];
}) {
  // pick 5 phones spaced across the lineup
  const lineup = phones.length > 5 ? [phones[0], phones[1], phones[3], phones[4], phones[5] || phones[2]] : phones;

  return (
    <div className="relative -mx-4 lg:-mx-0 mb-12 overflow-hidden rounded-2xl border border-ink-line bg-gradient-to-br from-bg-elev via-bg-soft to-bg lg:mx-0">
      {/* glow blobs */}
      <div className="absolute -top-32 -right-24 h-96 w-96 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

      <div className="relative px-6 pt-10 pb-0 lg:px-14 lg:pt-16">
        {date ? (
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.28em] text-accent">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent animate-pulse2" />
            GUIDE · {date}
          </div>
        ) : null}
        <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.12] tracking-tightish max-w-3xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-4 max-w-2xl text-base lg:text-lg text-ink-soft leading-relaxed">{subtitle}</p>
        ) : null}

        {/* phone lineup */}
        {lineup.length > 0 ? (
          <div className="mt-8 lg:mt-12 -mb-6 flex items-end justify-center gap-2 lg:gap-4 overflow-x-auto pb-2">
            {lineup.map((p, i) => (
              <div
                key={p.name + i}
                className="shrink-0 transition hover:-translate-y-2"
                style={{
                  transform: `rotate(${i % 2 === 0 ? -3 : 3}deg) translateY(${i === 2 ? "-6px" : "0"})`,
                  filter: `drop-shadow(0 16px 24px rgba(0,0,0,0.4))`,
                }}
              >
                <PhoneSvg brand={p.brand} color={p.color} accent={p.accent} width={70} height={144} />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
