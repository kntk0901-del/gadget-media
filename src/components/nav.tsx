import Link from "next/link";
import { Badge } from "./ui/primitives";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "GADGET//WIRE";

const NAV = [
  { href: "/latest",              label: "最新" },
  { href: "/featured",            label: "ピックアップ" },
  { href: "/guide",               label: "選び方" },
  { href: "/category/smartphones", label: "スマホ" },
  { href: "/category/charging",   label: "周辺機器" },
  { href: "/category/appliances", label: "家電" },
  { href: "/category/wearables",  label: "ウェアラブル" },
  { href: "/category/ebikes",     label: "e-bike" },
  { href: "/category/other",      label: "その他" },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-line/80 bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-screen-2xl items-center gap-6 px-4 py-3 lg:px-8">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="inline-block h-2 w-2 rounded-full bg-accent shadow-[0_0_12px_2px_rgba(124,228,212,0.7)] animate-pulse2" />
          <span className="font-display text-lg font-bold tracking-tightish">{SITE_NAME}</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1 overflow-x-auto">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-full px-3 py-1.5 text-sm text-ink-soft hover:bg-bg-elev hover:text-ink transition whitespace-nowrap">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex-1" />
        <form action="/search" className="relative hidden sm:block">
          <input
            name="q"
            placeholder="検索…"
            className="w-44 lg:w-72 rounded-full border border-ink-line bg-bg-elev px-4 py-1.5 text-sm placeholder:text-ink-muted focus:outline-none focus:border-accent/60"
          />
        </form>
        <Badge tone="accent">DAILY</Badge>
      </div>
      <div className="md:hidden border-t border-ink-line/70">
        <nav className="mx-auto flex max-w-screen-2xl items-center gap-1 overflow-x-auto px-3 py-2">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="shrink-0 rounded-full px-3 py-1 text-xs text-ink-soft hover:bg-bg-elev hover:text-ink whitespace-nowrap">
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
