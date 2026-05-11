import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ArticleCard as ArticleCardType } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { Badge, Pill } from "./ui/primitives";

function Thumb({ url, alt, kind = "default" }: { url: string | null; alt: string; kind?: "default" | "wide" | "compact" }) {
  const h = kind === "wide" ? "h-56" : kind === "compact" ? "h-24" : "h-40";
  if (!url) {
    return (
      <div className={`${h} w-full bg-gradient-to-br from-bg-elev via-bg-soft to-bg flex items-center justify-center border-b border-ink-line`}>
        <div className="font-mono text-[10px] tracking-[0.3em] text-ink-muted">画像なし</div>
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} className={`${h} w-full object-cover border-b border-ink-line`} loading="lazy" />;
}

export function ArticleCard({ a, kind = "default" }: { a: ArticleCardType; kind?: "default" | "wide" | "compact" }) {
  const href = `/article/${a.slug}`;
  if (kind === "compact") {
    return (
      <article className="group flex gap-3 border-b border-ink-line py-3 last:border-b-0">
        <Link href={href} className="block shrink-0">
          <div className="h-16 w-16 overflow-hidden rounded-md border border-ink-line bg-bg-elev">
            {a.thumbnail_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.thumbnail_url} alt="" className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-[9px] text-ink-muted font-mono">N/A</div>
            )}
          </div>
        </Link>
        <div className="min-w-0">
          <Link href={href} className="block text-sm font-medium leading-snug text-ink group-hover:text-accent line-clamp-2">{a.title}</Link>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-ink-muted">
            {a.source_name ? <span>{a.source_name}</span> : null}
            <span>·</span>
            <span>{timeAgo(a.published_at)}</span>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-ink-line bg-bg-soft shadow-card transition hover:border-accent/40 hover:-translate-y-0.5">
      <Link href={href} className="block">
        <Thumb url={a.thumbnail_url} alt={a.title} kind={kind} />
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {a.is_featured ? <Badge tone="accent">FEATURED</Badge> : null}
          {a.category_slug ? (
            <Link href={`/category/${a.category_slug}`}>
              <Pill className="hover:border-accent/40 hover:text-ink">{a.category_name}</Pill>
            </Link>
          ) : null}
          <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">{timeAgo(a.published_at)}</span>
        </div>
        <Link href={href} className="block">
          <h3 className={`font-display ${kind === "wide" ? "text-2xl" : "text-base"} font-semibold leading-snug tracking-tightish text-ink group-hover:text-accent line-clamp-3`}>
            {a.title}
          </h3>
        </Link>
        {a.short_summary ? (
          <p className="text-sm text-ink-soft leading-relaxed line-clamp-3">{a.short_summary}</p>
        ) : null}
        <div className="mt-auto flex items-center justify-between pt-2 border-t border-ink-line">
          <div className="text-[11px] text-ink-muted">
            {a.source_slug ? (
              <Link href={`/source/${a.source_slug}`} className="hover:text-ink">{a.source_name}</Link>
            ) : "—"}
          </div>
          <a
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-ink-line bg-bg-elev px-2.5 py-1 text-[11px] text-ink-soft hover:border-accent/40 hover:text-accent"
          >
            原文 <ArrowUpRight size={12} />
          </a>
        </div>
      </div>
    </article>
  );
}
