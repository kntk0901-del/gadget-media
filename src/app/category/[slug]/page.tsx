import { notFound } from "next/navigation";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Feed } from "@/components/feed";
import { FeedFilters } from "@/components/filters";
import { Badge, SectionHeader } from "@/components/ui/primitives";
import { getByCategory, getCategories } from "@/lib/queries";

export const revalidate = 600;

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const cats = await getCategories();
  const c = cats.find((x) => x.slug === params.slug);
  if (!c) return { title: "Category" };
  return {
    title: `${c.name} の最新記事`,
    description: c.description ?? `${c.name} のキュレーション記事。`,
    alternates: { canonical: `/category/${c.slug}` },
  };
}

export default async function CategoryPage({
  params, searchParams,
}: { params: { slug: string }; searchParams: { sort?: string } }) {
  const cats = await getCategories();
  const cat = cats.find((c) => c.slug === params.slug);
  if (!cat) notFound();
  const sort = (searchParams.sort === "fresh" ? "fresh" : "score") as "fresh" | "score";
  const items = await getByCategory(params.slug, { limit: 60, sort });

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-screen-2xl px-4 py-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge tone="accent">CATEGORY</Badge>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tightish">{cat.name}</h1>
            {cat.description ? <p className="mt-1 text-sm text-ink-muted">{cat.description}</p> : null}
          </div>
          <FeedFilters categories={cats} />
        </div>
        <SectionHeader tag={params.slug.toUpperCase()} title={sort === "fresh" ? "新着順" : "スコア順"} accessory={`${items.length} 件`} />
        <Feed items={items} columns={3} />
      </main>
      <Footer />
    </>
  );
}
