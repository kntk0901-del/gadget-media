import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Markdown } from "@/components/markdown";
import { Badge, Pill } from "@/components/ui/primitives";
import { getAllGuides, getGuideBySlug } from "@/lib/guides";
import { getByCategory } from "@/lib/queries";
import { ArticleCard } from "@/components/article-card";

export const revalidate = 3600;
export const dynamicParams = false;

export async function generateStaticParams() {
  return getAllGuides().map((g) => ({ slug: g.frontmatter.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const g = getGuideBySlug(params.slug);
  if (!g) return { title: "Guide" };
  const url = `/guide/${g.frontmatter.slug}`;
  return {
    title: g.frontmatter.title,
    description: g.frontmatter.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: g.frontmatter.title,
      description: g.frontmatter.description,
      url,
      publishedTime: g.frontmatter.publishedAt,
      modifiedTime: g.frontmatter.updatedAt || g.frontmatter.publishedAt,
      authors: [g.frontmatter.author],
      images: g.frontmatter.heroImage ? [g.frontmatter.heroImage] : [],
    },
    twitter: { card: "summary_large_image", title: g.frontmatter.title, description: g.frontmatter.description },
  };
}

export default async function GuidePage({ params }: { params: { slug: string } }) {
  const guide = getGuideBySlug(params.slug);
  if (!guide) notFound();

  const { frontmatter, body } = guide;
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const url = `${site}/guide/${frontmatter.slug}`;

  // Related curated articles from related categories (3 per category, up to 9)
  const relatedCats = frontmatter.relatedCategories ?? [];
  const related = (
    await Promise.all(relatedCats.map((slug) => getByCategory(slug, { limit: 3 })))
  ).flat();

  // ---- Structured data ----
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: frontmatter.title,
    description: frontmatter.description,
    datePublished: frontmatter.publishedAt,
    dateModified: frontmatter.updatedAt || frontmatter.publishedAt,
    author: { "@type": "Organization", name: frontmatter.author, url: site },
    publisher: {
      "@type": "Organization",
      name: process.env.NEXT_PUBLIC_SITE_NAME || "GADGET//WIRE",
      url: site,
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    image: frontmatter.heroImage ? [frontmatter.heroImage] : undefined,
    keywords: frontmatter.tags?.join(", "),
    inLanguage: "ja-JP",
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "ホーム", item: site },
      { "@type": "ListItem", position: 2, name: "ガイド", item: `${site}/guide` },
      { "@type": "ListItem", position: 3, name: frontmatter.title, item: url },
    ],
  };

  const faqSchema = frontmatter.faqs && frontmatter.faqs.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: frontmatter.faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }
    : null;

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-4 py-8 lg:px-0">
        {/* JSON-LD */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
        {faqSchema && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
        )}

        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-[12px] text-ink-muted">
          <Link href="/" className="hover:text-ink">ホーム</Link>
          <span>/</span>
          <Link href="/guide" className="hover:text-ink">ガイド</Link>
          <span>/</span>
          <span className="text-ink line-clamp-1">{frontmatter.title}</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <Badge tone="accent">GUIDE · {frontmatter.publishedAt}</Badge>
          <h1 className="mt-3 font-display text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.18] tracking-tightish">
            {frontmatter.title}
          </h1>
          <p className="mt-4 text-base text-ink-soft leading-relaxed">{frontmatter.description}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-[12px] text-ink-muted">
            <span>{frontmatter.author}</span>
            <span>·</span>
            <span>更新 {frontmatter.updatedAt || frontmatter.publishedAt}</span>
            {frontmatter.tags && frontmatter.tags.length > 0 && (
              <>
                <span>·</span>
                <div className="flex flex-wrap gap-1">
                  {frontmatter.tags.map((t) => (
                    <Pill key={t}>{t}</Pill>
                  ))}
                </div>
              </>
            )}
          </div>
        </header>

        {/* Body */}
        <Markdown source={body} />

        {/* FAQ (rendered visually too, in addition to JSON-LD) */}
        {frontmatter.faqs && frontmatter.faqs.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tightish mb-6 pb-2 border-b border-ink-line">
              よくある質問（FAQ）
            </h2>
            <div className="space-y-5">
              {frontmatter.faqs.map((f, i) => (
                <details key={i} className="group rounded-xl border border-ink-line bg-bg-soft p-5 open:bg-bg-elev">
                  <summary className="cursor-pointer list-none font-semibold text-ink text-[15px] flex items-start gap-3">
                    <span className="text-accent font-mono shrink-0">Q{i + 1}.</span>
                    <span>{f.q}</span>
                  </summary>
                  <div className="mt-3 pl-7 text-[14px] leading-[1.85] text-ink-soft">{f.a}</div>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Related curated articles */}
        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tightish mb-6 pb-2 border-b border-ink-line">
              関連の最新ニュース
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {related.slice(0, 6).map((a) => (
                <ArticleCard key={a.id} a={a} />
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              {relatedCats.map((cat) => (
                <Link
                  key={cat}
                  href={`/category/${cat}`}
                  className="rounded-full border border-ink-line bg-bg-elev px-4 py-1.5 text-ink-soft hover:border-accent/40 hover:text-accent"
                >
                  カテゴリで続きを見る →
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
