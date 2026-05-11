import { createSupabaseServer } from "./supabase/server";
import type { ArticleCard, Category, Source, Tag } from "./types";

const CARD_COLS = "id,slug,title,url,short_summary,editorial_note,thumbnail_url,published_at,ingested_at,score,is_featured,is_published,source_id,source_slug,source_name,category_id,category_slug,category_name";

export async function getCategories(): Promise<Category[]> {
  const s = createSupabaseServer();
  const { data } = await s.from("categories").select("*").order("priority", { ascending: false });
  return (data ?? []) as Category[];
}

export async function getSources(opts: { enabledOnly?: boolean } = {}): Promise<Source[]> {
  const s = createSupabaseServer();
  let q = s.from("sources").select("*").order("name");
  if (opts.enabledOnly) q = q.eq("is_enabled", true);
  const { data } = await q;
  return (data ?? []) as Source[];
}

export async function getTags(limit = 60): Promise<Tag[]> {
  const s = createSupabaseServer();
  const { data } = await s.from("tags").select("*").order("name").limit(limit);
  return (data ?? []) as Tag[];
}

export async function getFeaturedArticles(limit = 5): Promise<ArticleCard[]> {
  const s = createSupabaseServer();
  const { data } = await s
    .from("article_cards")
    .select(CARD_COLS)
    .eq("is_featured", true)
    .order("score", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as ArticleCard[];
}

export async function getLatestArticles(limit = 24): Promise<ArticleCard[]> {
  const s = createSupabaseServer();
  const { data } = await s
    .from("article_cards")
    .select(CARD_COLS)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  return (data ?? []) as ArticleCard[];
}

export async function getTopArticles(limit = 18): Promise<ArticleCard[]> {
  const s = createSupabaseServer();
  const since = new Date(Date.now() - 72 * 3600_000).toISOString();
  const { data } = await s
    .from("article_cards")
    .select(CARD_COLS)
    .gte("published_at", since)
    .order("score", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as ArticleCard[];
}

export async function getByCategory(slug: string, opts: { limit?: number; sort?: "score" | "fresh" } = {}): Promise<ArticleCard[]> {
  const s = createSupabaseServer();
  const limit = opts.limit ?? 24;
  let q = s.from("article_cards").select(CARD_COLS).eq("category_slug", slug);
  if (opts.sort === "fresh") q = q.order("published_at", { ascending: false });
  else q = q.order("score", { ascending: false }).order("published_at", { ascending: false });
  const { data } = await q.limit(limit);
  return (data ?? []) as ArticleCard[];
}

export async function getBySource(slug: string, limit = 30): Promise<ArticleCard[]> {
  const s = createSupabaseServer();
  const { data } = await s
    .from("article_cards")
    .select(CARD_COLS)
    .eq("source_slug", slug)
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as ArticleCard[];
}

export async function getByTag(slug: string, limit = 30): Promise<ArticleCard[]> {
  const s = createSupabaseServer();
  const { data: tag } = await s.from("tags").select("id").eq("slug", slug).maybeSingle();
  if (!tag) return [];
  const { data: relations } = await s.from("article_tags").select("article_id").eq("tag_id", tag.id).limit(200);
  const ids = (relations ?? []).map((r: any) => r.article_id);
  if (!ids.length) return [];
  const { data } = await s
    .from("article_cards")
    .select(CARD_COLS)
    .in("id", ids)
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as ArticleCard[];
}

export async function searchArticles(q: string, limit = 30): Promise<ArticleCard[]> {
  const s = createSupabaseServer();
  const cleaned = q.trim().replace(/[^\w\s\-]/g, " ").slice(0, 80);
  if (!cleaned) return [];
  const { data } = await s
    .from("article_cards")
    .select(CARD_COLS)
    .ilike("title", `%${cleaned}%`)
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as ArticleCard[];
}

export async function getArticleBySlug(slug: string): Promise<ArticleCard | null> {
  const s = createSupabaseServer();
  const { data } = await s.from("article_cards").select(CARD_COLS).eq("slug", slug).maybeSingle();
  return (data as ArticleCard) ?? null;
}

export async function getRelatedArticles(article: ArticleCard, limit = 6): Promise<ArticleCard[]> {
  const s = createSupabaseServer();
  if (!article.category_slug) return [];
  const { data } = await s
    .from("article_cards")
    .select(CARD_COLS)
    .eq("category_slug", article.category_slug)
    .neq("id", article.id)
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as ArticleCard[];
}

export async function getSameSourceArticles(article: ArticleCard, limit = 6): Promise<ArticleCard[]> {
  const s = createSupabaseServer();
  if (!article.source_slug) return [];
  const { data } = await s
    .from("article_cards")
    .select(CARD_COLS)
    .eq("source_slug", article.source_slug)
    .neq("id", article.id)
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as ArticleCard[];
}
