import type { GuidePhone } from "@/lib/guides";
import { PhoneSvg } from "./phone-svg";

/** Visually rich grid of phone cards — real photo with stylized SVG fallback. */
export function PhoneShowcase({ phones }: { phones: GuidePhone[] }) {
  if (!phones || phones.length === 0) return null;
  return (
    <section className="my-14">
      <header className="mb-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent mb-2">
          この記事で比較する {phones.length} 機種
        </div>
        <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tightish">主役のラインナップ</h2>
      </header>
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {phones.map((p) => (
          <PhoneCard key={p.name} phone={p} />
        ))}
      </div>
    </section>
  );
}

function PhoneCard({ phone }: { phone: GuidePhone }) {
  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-xl border border-ink-line bg-bg-soft transition hover:-translate-y-0.5 hover:border-accent/40"
      style={{ ["--brand" as any]: phone.accent }}
    >
      {/* color bar */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 z-10 h-1"
        style={{ background: `linear-gradient(90deg, ${phone.color}, ${phone.accent})` }}
      />

      {/* Image area — real photo with subtle color overlay, falls back to SVG */}
      <div
        className="relative h-44 w-full overflow-hidden"
        style={{
          background: `linear-gradient(160deg, ${phone.color}, ${phone.accent})`,
        }}
      >
        {phone.photo ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={phone.photo}
              alt={`${phone.name}`}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover opacity-95 transition group-hover:scale-105"
            />
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background: `linear-gradient(180deg, transparent 40%, rgba(10,10,12,0.85) 100%)`,
              }}
            />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <PhoneSvg brand={phone.brand} color={phone.color} accent={phone.accent} width={70} height={140} />
          </div>
        )}
        <div className="absolute inset-x-3 bottom-2 flex items-end justify-between gap-2">
          <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/70">{phone.brand}</div>
          {phone.price ? (
            <div className="rounded-full bg-black/40 px-2 py-0.5 font-mono text-[10px] text-white backdrop-blur-sm">
              {phone.price}
            </div>
          ) : null}
        </div>
      </div>

      {/* Text area */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-display text-base font-semibold leading-tight text-ink">{phone.name}</h3>
        <p className="text-[12px] text-ink-soft line-clamp-2 leading-snug">{phone.tagline}</p>
        <div className="mt-auto pt-2">
          <span
            className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium"
            style={{ background: `${phone.accent}22`, color: phone.accent }}
          >
            {phone.bestFor}
          </span>
        </div>
      </div>
    </article>
  );
}
