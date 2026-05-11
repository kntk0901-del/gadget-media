import type { GuidePhone } from "@/lib/guides";
import { PhoneSvg } from "./phone-svg";

/** Visually rich grid of phone cards — replaces the wall-of-text feel. */
export function PhoneShowcase({ phones }: { phones: GuidePhone[] }) {
  if (!phones || phones.length === 0) return null;
  return (
    <section className="my-14">
      <header className="mb-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent mb-2">この記事で比較する 9 機種</div>
        <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tightish">主役のラインナップ</h2>
      </header>
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {phones.map((p) => (
          <PhoneCard key={p.name} phone={p} />
        ))}
      </div>
    </section>
  );
}

function PhoneCard({ phone }: { phone: GuidePhone }) {
  return (
    <div
      className="group relative overflow-hidden rounded-xl border border-ink-line bg-bg-soft p-4 pb-5 transition hover:-translate-y-0.5 hover:border-accent/40"
      style={{ ["--brand" as any]: phone.accent }}
    >
      {/* color bar */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: `linear-gradient(90deg, ${phone.color}, ${phone.accent})` }}
      />
      <div className="flex items-start gap-3">
        <div
          className="shrink-0 rounded-lg p-2"
          style={{ background: `linear-gradient(160deg, ${phone.color}26, ${phone.accent}1f)` }}
        >
          <PhoneSvg brand={phone.brand} color={phone.color} accent={phone.accent} width={50} height={104} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-ink-muted">{phone.brand}</div>
          <div className="font-display font-semibold text-ink leading-tight line-clamp-2">{phone.name}</div>
          <div className="mt-1 text-[12px] text-ink-soft line-clamp-2">{phone.tagline}</div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 pt-3 border-t border-ink-line/70">
        <span
          className="rounded-full px-2.5 py-0.5 text-[10px] font-medium"
          style={{ background: `${phone.accent}1f`, color: phone.accent }}
        >
          {phone.bestFor}
        </span>
        {phone.price ? (
          <span className="font-mono text-[11px] text-ink-muted">{phone.price}</span>
        ) : null}
      </div>
    </div>
  );
}
