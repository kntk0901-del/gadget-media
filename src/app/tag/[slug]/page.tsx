import { notFound } from "next/navigation";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Feed } from "@/components/feed";
import { Badge, SectionHeader } from "@/components/ui/primitives";
import { getByTag } from "@/lib/queries";
import { createSupabaseServer } from "@/lib/supabase/server";

export const revalidate = 600;

export async function generateMetadata({ params }: { params: { slug: string } }) {
  return { title: `#${params.slug} — gadget posts`, alternates: { canonical: `/tag/${params.slug}` } };
}

export default async function TagPage({ params }: { params: { slug: string } }) {
  const supabase = createSupabaseServer();
  const { data: tag } = await supabase.from("tags").select("*").eq("slug", params.slug).maybeSingle();
  if (!tag) notFound();
  const items = await getByTag(params.slug, 60);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-screen-2xl px-4 py-6 lg:px-8">
        <div className="mb-8">
          <Badge tone="accent">TAG · {tag.kind}</Badge>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tightish">#{tag.name}</h1>
          <p className="mt-1 text-sm text-ink-muted">{tag.name} の記事 {items.length} 件</p>
        </div>
        <SectionHeader tag={params.slug.toUpperCase()} title="新着" />
        <Feed items={items} columns={3} />
      </main>
      <Footer />
    </>
  );
}
