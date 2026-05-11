import { notFound } from "next/navigation";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Feed } from "@/components/feed";
import { Badge, Pill, SectionHeader } from "@/components/ui/primitives";
import { getBySource } from "@/lib/queries";
import { createSupabaseServer } from "@/lib/supabase/server";

export const revalidate = 600;

export async function generateMetadata({ params }: { params: { slug: string } }) {
  return { title: `Source: ${params.slug}`, alternates: { canonical: `/source/${params.slug}` } };
}

export default async function SourcePage({ params }: { params: { slug: string } }) {
  const supabase = createSupabaseServer();
  const { data: source } = await supabase.from("sources").select("*").eq("slug", params.slug).maybeSingle();
  if (!source) notFound();
  const items = await getBySource(params.slug, 60);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-screen-2xl px-4 py-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end gap-3">
          <div>
            <Badge tone="accent">SOURCE</Badge>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tightish">{source.name}</h1>
            {source.homepage_url ? (
              <a className="mt-1 inline-block text-sm text-ink-soft hover:text-accent" target="_blank" rel="noopener noreferrer" href={source.homepage_url}>
                {source.homepage_url}
              </a>
            ) : null}
          </div>
          <Pill>weight {source.weight.toFixed(2)}</Pill>
          <Pill>{source.feed_kind.toUpperCase()}</Pill>
          <Pill>{source.language.toUpperCase()}</Pill>
        </div>
        <SectionHeader tag={params.slug.toUpperCase()} title={`${source.name} の最新`} accessory={`${items.length} 件`} />
        <Feed items={items} columns={3} />
      </main>
      <Footer />
    </>
  );
}
