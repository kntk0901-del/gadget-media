"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";

const SORTS = [
  { value: "score", label: "スコア順" },
  { value: "fresh", label: "新着" },
];

export function FeedFilters({ categories }: { categories: { slug: string; name: string }[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();
  const [pending, start] = useTransition();

  const currentCat = params.get("cat") || "";
  const currentSort = params.get("sort") || "score";
  const currentTag = params.get("tag") || "";

  function update(k: string, v: string) {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    start(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
  }

  return (
    <div className={`flex flex-wrap items-center gap-3 ${pending ? "opacity-70" : ""}`}>
      <div className="flex items-center gap-1 rounded-full border border-ink-line bg-bg-soft p-1">
        {SORTS.map((s) => (
          <button
            key={s.value}
            onClick={() => update("sort", s.value)}
            className={`rounded-full px-3 py-1 text-xs ${currentSort === s.value ? "bg-accent text-bg" : "text-ink-soft hover:bg-bg-elev"}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <select
        value={currentCat}
        onChange={(e) => update("cat", e.target.value)}
        className="rounded-full border border-ink-line bg-bg-soft px-3 py-1.5 text-xs"
      >
        <option value="">全カテゴリ</option>
        {categories.map((c) => (<option key={c.slug} value={c.slug}>{c.name}</option>))}
      </select>

      <input
        defaultValue={currentTag}
        onKeyDown={(e) => { if (e.key === "Enter") update("tag", (e.target as HTMLInputElement).value); }}
        placeholder="タグで絞り込み…"
        className="w-36 rounded-full border border-ink-line bg-bg-soft px-3 py-1.5 text-xs placeholder:text-ink-muted focus:outline-none focus:border-accent/60"
      />
    </div>
  );
}
