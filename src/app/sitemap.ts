import type { MetadataRoute } from "next";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getAllGuides } from "@/lib/guides";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const supabase = createSupabaseServer();
  const [{ data: arts }, { data: cats }, { data: tags }, { data: srcs }] = await Promise.all([
    supabase.from("articles").select("slug, published_at").eq("is_published", true).is("dedupe_master_id", null).order("published_at", { ascending: false }).limit(2000),
    supabase.from("categories").select("slug"),
    supabase.from("tags").select("slug").limit(200),
    supabase.from("sources").select("slug"),
  ]);

  const now = new Date();
  const fixed: MetadataRoute.Sitemap = [
    { url: `${base}/`,         lastModified: now, priority: 1.0, changeFrequency: "hourly" },
    { url: `${base}/latest`,   lastModified: now, priority: 0.9, changeFrequency: "hourly" },
    { url: `${base}/featured`, lastModified: now, priority: 0.8, changeFrequency: "daily" },
    { url: `${base}/guide`,    lastModified: now, priority: 0.85, changeFrequency: "weekly" },
  ];

  // Editorial guides (long-form, high SEO priority)
  const guides = getAllGuides().map((g) => ({
    url: `${base}/guide/${g.frontmatter.slug}`,
    lastModified: new Date(g.frontmatter.updatedAt || g.frontmatter.publishedAt || now),
    priority: 0.9,
    changeFrequency: "monthly" as const,
  }));

  const c = (cats ?? []).map((c: any) => ({ url: `${base}/category/${c.slug}`, lastModified: now, priority: 0.7 }));
  const t = (tags ?? []).map((t: any) => ({ url: `${base}/tag/${t.slug}`, lastModified: now, priority: 0.5 }));
  const s = (srcs ?? []).map((s: any) => ({ url: `${base}/source/${s.slug}`, lastModified: now, priority: 0.5 }));
  const a = (arts ?? []).map((a: any) => ({ url: `${base}/article/${a.slug}`, lastModified: a.published_at ?? now, priority: 0.6 }));
  return [...fixed, ...guides, ...c, ...t, ...s, ...a];
}
