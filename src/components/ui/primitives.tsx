import { cn } from "@/lib/utils";

export function Badge({ children, tone = "default", className }: { children: React.ReactNode; tone?: "default" | "accent" | "warn" | "live"; className?: string }) {
  const tones: Record<string, string> = {
    default: "bg-ink-line text-ink-soft border-ink-line",
    accent:  "bg-accent/15 text-accent border-accent/30",
    warn:    "bg-warn/15 text-warn border-warn/30",
    live:    "bg-live/15 text-live border-live/30",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.18em]", tones[tone], className)}>
      {children}
    </span>
  );
}

export function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border border-ink-line bg-bg-elev px-2.5 py-0.5 text-[11px] text-ink-soft", className)}>
      {children}
    </span>
  );
}

export function Hr({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-gradient-to-r from-transparent via-ink-line to-transparent", className)} />;
}

export function SectionHeader({
  tag, title, accessory,
}: { tag?: string; title: string; accessory?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 border-b border-ink-line pb-3 mb-5">
      <div className="flex items-baseline gap-3">
        {tag ? <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent">{tag}</span> : null}
        <h2 className="font-display text-xl font-semibold tracking-tightish">{title}</h2>
      </div>
      <div className="text-[11px] text-ink-muted">{accessory}</div>
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-md border border-dashed border-ink-line bg-bg-soft p-6 text-center text-sm text-ink-muted">{children}</div>;
}
