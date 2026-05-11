import { ArticleCard } from "./article-card";
import type { ArticleCard as A } from "@/lib/types";
import { Empty } from "./ui/primitives";

export function Feed({ items, columns = 3 }: { items: A[]; columns?: 2 | 3 | 4 }) {
  if (!items?.length) return <Empty>表示できる記事がありません。</Empty>;
  const grid = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  }[columns];
  return (
    <div className={`grid ${grid} gap-4 fadein`}>
      {items.map((a) => <ArticleCard key={a.id} a={a} />)}
    </div>
  );
}

export function CompactList({ items }: { items: A[] }) {
  if (!items?.length) return <Empty>記事がありません。</Empty>;
  return (
    <div className="divide-y divide-ink-line rounded-xl border border-ink-line bg-bg-soft px-4">
      {items.map((a) => <ArticleCard key={a.id} a={a} kind="compact" />)}
    </div>
  );
}
