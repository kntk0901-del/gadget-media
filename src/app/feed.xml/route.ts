import { NextResponse } from "next/server";
import { getLatestArticles } from "@/lib/queries";
import { getAllGuides } from "@/lib/guides";

export const revalidate = 600;

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "GADGET//WIRE";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

function escape(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const [articles, guides] = await Promise.all([
    getLatestArticles(30),
    Promise.resolve(getAllGuides()),
  ]);

  const items: { url: string; title: string; description: string; pubDate: string; category: string }[] = [];

  // Editorial guides first (high signal)
  for (const g of guides) {
    items.push({
      url: `${SITE_URL}/guide/${g.frontmatter.slug}`,
      title: g.frontmatter.title,
      description: g.frontmatter.description,
      pubDate: new Date(g.frontmatter.updatedAt || g.frontmatter.publishedAt).toUTCString(),
      category: "Guide",
    });
  }

  for (const a of articles) {
    items.push({
      url: `${SITE_URL}/article/${a.slug}`,
      title: a.title,
      description: a.short_summary ?? "",
      pubDate: new Date(a.published_at || a.ingested_at).toUTCString(),
      category: a.category_name || "News",
    });
  }

  // Sort newest first
  items.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escape(SITE_NAME)} — 毎日のハードガジェット・キュレーション</title>
    <link>${SITE_URL}</link>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <description>スマートフォン、GaN 充電器、家電、ウェアラブル、e-bike など、ハードガジェットの最新情報を毎日キュレーション。</description>
    <language>ja</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items.map((it) => `    <item>
      <title>${escape(it.title)}</title>
      <link>${escape(it.url)}</link>
      <guid isPermaLink="true">${escape(it.url)}</guid>
      <pubDate>${it.pubDate}</pubDate>
      <category>${escape(it.category)}</category>
      <description>${escape(it.description)}</description>
    </item>`).join("\n")}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
    },
  });
}
