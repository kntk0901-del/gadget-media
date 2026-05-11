import type { GuideUseCase } from "@/lib/guides";
import { UseCaseIcon } from "./section-icons";

/** Visual "best for X → buy Y" matrix. Replaces a plain markdown table. */
export function UseCaseMatrix({ items }: { items: GuideUseCase[] }) {
  if (!items || items.length === 0) return null;
  return (
    <section className="my-14">
      <header className="mb-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent mb-2">用途別ベスト早見</div>
        <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tightish">あなたに刺さる 1 台はどれ？</h2>
      </header>
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((u) => (
          <div
            key={u.label}
            className="group relative overflow-hidden rounded-xl border border-ink-line bg-bg-soft p-5 transition hover:border-accent/40 hover:-translate-y-0.5"
          >
            <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-accent/5 blur-2xl" />
            <div className="relative flex items-start gap-4">
              <div className="rounded-lg border border-accent/30 bg-accent/10 p-2.5 text-accent">
                <UseCaseIcon icon={u.icon} size={26} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">{u.label}</div>
                <div className="font-display text-lg font-semibold leading-tight text-ink mt-0.5">{u.pick}</div>
                {u.runner ? (
                  <div className="mt-1 text-[12px] text-ink-soft">
                    <span className="text-ink-muted">次点:</span> {u.runner}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Bottom-of-article "buyer's verdict" — the single take-home recommendation. */
export function VerdictBox({ phone, reason }: { phone: string; reason: string }) {
  return (
    <aside className="my-12 overflow-hidden rounded-2xl border border-accent/40 bg-gradient-to-br from-accent/10 via-bg-soft to-bg">
      <div className="relative px-6 py-6 lg:px-10 lg:py-8">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
        <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent mb-2">編集部の最終判定</div>
        <div className="font-display text-2xl md:text-3xl font-bold leading-tight tracking-tightish">
          迷ったら買うべきは <span className="text-accent">{phone}</span>
        </div>
        <p className="mt-3 text-sm md:text-base text-ink-soft leading-relaxed max-w-2xl">{reason}</p>
      </div>
    </aside>
  );
}
