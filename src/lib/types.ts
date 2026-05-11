export type Category = {
  id: string;
  slug: string;
  name: string;
  priority: number;
  is_primary: boolean;
  description: string | null;
};

export type Tag = {
  id: string;
  slug: string;
  name: string;
  kind: "topic" | "brand" | "tech";
};

export type Source = {
  id: string;
  slug: string;
  name: string;
  homepage_url: string | null;
  feed_url: string | null;
  feed_kind: "rss" | "atom" | "json" | "api" | "manual";
  is_enabled: boolean;
  weight: number;
  language: string;
  notes: string | null;
  last_ingest_at: string | null;
};

export type ArticleCard = {
  id: string;
  slug: string;
  title: string;
  url: string;
  short_summary: string | null;
  editorial_note: string | null;
  thumbnail_url: string | null;
  published_at: string | null;
  ingested_at: string;
  score: number;
  is_featured: boolean;
  is_published: boolean;
  source_id: string | null;
  source_slug: string | null;
  source_name: string | null;
  category_id: string | null;
  category_slug: string | null;
  category_name: string | null;
};

export type ArticleFull = ArticleCard & {
  editorial_boost: number;
  novelty: number;
  is_blacklisted: boolean;
  dedupe_master_id: string | null;
  url_hash: string;
  title_norm: string;
  raw_meta: Record<string, unknown>;
};

export type IngestLog = {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: "running" | "ok" | "partial" | "error";
  source_count: number;
  fetched_count: number;
  created_count: number;
  skipped_count: number;
  error_count: number;
  trigger: "cron" | "manual" | "dev";
  detail: Record<string, unknown>;
};
