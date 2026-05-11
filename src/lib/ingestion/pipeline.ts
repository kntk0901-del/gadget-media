import { createSupabaseAdmin } from "../supabase/admin";
import { clampSummary, normalizeTitle, normalizeUrl, slugify } from "../utils";
import { classify } from "./classify";
import { DedupeCandidate, findDuplicate, urlHashFor } from "./dedupe";
import { fetchFeed, FetchedItem, fetchOgImage } from "./rss";
import { scoreArticle } from "./scoring";

const LOCK_ID = "global-ingest";
const LOCK_TTL_MIN = 10;
const RECENT_CANDIDATES_DAYS = 14;
const MAX_ITEMS_PER_SOURCE = 30;

export type IngestSummary = {
  log_id: string;
  status: "ok" | "partial" | "error";
  source_count: number;
  fetched_count: number;
  created_count: number;
  skipped_count: number;
  error_count: number;
  errors: { source: string; message: string }[];
};

export async function runIngest(trigger: "cron" | "manual" | "dev" = "cron"): Promise<IngestSummary> {
  const supabase = createSupabaseAdmin();

  // ---- lock ----
  const now = new Date();
  const expires = new Date(now.getTime() + LOCK_TTL_MIN * 60_000);
  await supabase.from("ingest_locks").delete().lt("expires_at", now.toISOString());
  const { error: lockErr } = await supabase
    .from("ingest_locks")
    .insert({ id: LOCK_ID, expires_at: expires.toISOString() });
  if (lockErr) {
    throw new Error(`ingest already running: ${lockErr.message}`);
  }

  // ---- log row ----
  const { data: log, error: logErr } = await supabase
    .from("ingest_logs")
    .insert({ trigger })
    .select("id")
    .single();
  if (logErr || !log) throw new Error(`failed to create log: ${logErr?.message}`);
  const logId = log.id as string;

  const summary: IngestSummary = {
    log_id: logId,
    status: "ok",
    source_count: 0,
    fetched_count: 0,
    created_count: 0,
    skipped_count: 0,
    error_count: 0,
    errors: [],
  };

  try {
    // ---- fetch sources & rules ----
    const { data: sources } = await supabase
      .from("sources")
      .select("*")
      .eq("is_enabled", true);
    const { data: categories } = await supabase.from("categories").select("id, slug, priority");
    const catBySlug = new Map(categories?.map((c: any) => [c.slug, c]) ?? []);

    // recent candidates for dedupe
    const since = new Date(Date.now() - RECENT_CANDIDATES_DAYS * 24 * 3600_000).toISOString();
    const { data: candidates } = await supabase
      .from("articles")
      .select("id, title_norm, url_hash, published_at")
      .gte("ingested_at", since);
    const candidateList: DedupeCandidate[] = (candidates ?? []) as any;

    summary.source_count = sources?.length ?? 0;

    for (const src of sources ?? []) {
      try {
        if (!src.feed_url || src.feed_kind === "manual") continue;
        const items = await fetchFeed(src.feed_url);
        const slice = items.slice(0, MAX_ITEMS_PER_SOURCE);
        summary.fetched_count += slice.length;

        for (const it of slice) {
          const created = await ingestItem(supabase, src, it, catBySlug, candidateList);
          if (created === "new") {
            summary.created_count += 1;
          } else {
            summary.skipped_count += 1;
          }
        }
        await supabase.from("sources").update({ last_ingest_at: new Date().toISOString() }).eq("id", src.id);
      } catch (e: any) {
        summary.error_count += 1;
        summary.errors.push({ source: src.slug, message: String(e?.message ?? e) });
      }
    }

    if (summary.error_count > 0 && summary.created_count > 0) summary.status = "partial";
    else if (summary.error_count > 0 && summary.created_count === 0) summary.status = "error";

    // Phase 2 — backfill missing thumbnails via og:image (concurrent).
    try {
      const filled = await backfillThumbnails(supabase, 80, 8);
      (summary as any).thumbnails_filled = filled;
    } catch (e: any) {
      summary.errors.push({ source: "(thumbnail-backfill)", message: String(e?.message ?? e) });
    }
  } catch (e: any) {
    summary.status = "error";
    summary.errors.push({ source: "(pipeline)", message: String(e?.message ?? e) });
  } finally {
    await supabase
      .from("ingest_logs")
      .update({
        finished_at: new Date().toISOString(),
        status: summary.status,
        source_count: summary.source_count,
        fetched_count: summary.fetched_count,
        created_count: summary.created_count,
        skipped_count: summary.skipped_count,
        error_count: summary.error_count,
        detail: { errors: summary.errors },
      })
      .eq("id", logId);
    await supabase.from("ingest_locks").delete().eq("id", LOCK_ID);
  }

  return summary;
}

async function ingestItem(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  src: any,
  it: FetchedItem,
  catBySlug: Map<string, any>,
  candidates: DedupeCandidate[]
): Promise<"new" | "skip"> {
  const url = normalizeUrl(it.url);
  const urlHash = await urlHashFor(url);
  const title = (it.title ?? "").trim();
  if (!title || !url) return "skip";

  // dedupe
  const dup = findDuplicate({
    urlHash,
    title,
    publishedAt: it.published_at,
    candidates,
  });
  if (dup.kind === "exact_url") return "skip";

  // classify
  const cls = classify({ title, summary: it.summary ?? null, sourceSlug: src.slug });
  if (cls.is_blacklisted) return "skip";
  // Allow source-level category hint if classifier didn't catch one
  if (!cls.category_slug) {
    const { data: rule } = await supabase
      .from("source_rules")
      .select("category_slug, score_delta")
      .eq("source_id", src.id)
      .eq("rule_kind", "category_hint")
      .limit(1)
      .maybeSingle();
    if (rule?.category_slug) cls.category_slug = rule.category_slug;
    if (rule?.score_delta)   cls.keyword_boost += rule.score_delta;
  }
  // Hard-gadget gate: drop only if NOT relevant AND no category at all.
  if (!cls.is_relevant && !cls.category_slug) return "skip";
  // Relevant but no specific bucket → put in "その他ガジェット"
  if (cls.is_relevant && !cls.category_slug) cls.category_slug = "other";

  const cat = cls.category_slug ? catBySlug.get(cls.category_slug) : null;
  const categoryId: string | null = cat?.id ?? null;
  const categoryPriority: number = cat?.priority ?? 50;

  // duplicates → mark relation but still insert (so we keep editorial control)
  const isDuplicate = dup.kind === "near_title" || dup.kind === "same_topic_recent";
  const dedupeMasterId = isDuplicate ? (dup as any).masterId : null;

  // score
  const score = scoreArticle({
    publishedAt: it.published_at,
    sourceWeight: src.weight ?? 1,
    categoryPriority,
    keywordBoost: cls.keyword_boost,
    editorialBoost: 0,
    novelty: 1.0,
    isDuplicate,
    isBlacklisted: false,
  });

  const slug = `${slugify(title)}-${urlHash.slice(0, 8)}`;
  const shortSummary = clampSummary(it.summary, 240);

  const { error } = await supabase.from("articles").insert({
    slug,
    source_id: src.id,
    category_id: categoryId,
    title,
    url,
    url_hash: urlHash,
    title_norm: normalizeTitle(title),
    short_summary: shortSummary,
    editorial_note: null,
    thumbnail_url: it.thumbnail_url,
    published_at: it.published_at,
    score,
    novelty: 1.0,
    is_featured: false,
    is_published: !isDuplicate,             // duplicates land as draft for editor review
    is_blacklisted: false,
    dedupe_master_id: dedupeMasterId,
    raw_meta: {
      author: it.author,
      classify: { tags: cls.tags, reasons: cls.reasons, boost: cls.keyword_boost },
      dedupe: dup,
    },
  });
  if (error) {
    if (error.code === "23505") return "skip"; // unique violation, already inserted concurrently
    throw error;
  }

  // Fetch the just-inserted row id (single round-trip).
  const { data: created } = await supabase
    .from("articles")
    .select("id")
    .eq("url_hash", urlHash)
    .maybeSingle();

  // attach tags
  if (created?.id && cls.tags.length > 0) {
    const { data: tagRows } = await supabase.from("tags").select("id, slug").in("slug", cls.tags);
    if (tagRows && tagRows.length > 0) {
      const rows = tagRows.map((t: any) => ({ article_id: created.id, tag_id: t.id }));
      await supabase.from("article_tags").upsert(rows, { onConflict: "article_id,tag_id" });
    }
  }

  // push to candidate pool for in-run dedupe; use real id when available
  candidates.push({
    id: created?.id ?? dedupeMasterId ?? "",
    title_norm: normalizeTitle(title),
    url_hash: urlHash,
    published_at: it.published_at,
  });
  return "new";
}

/**
 * Backfill missing thumbnails by fetching each article's og:image.
 * Runs after the main ingest. Concurrent with bounded workers so 50+ items
 * complete in under a Vercel function budget.
 */
export async function backfillThumbnails(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  limit = 80,
  concurrency = 8
): Promise<number> {
  const { data } = await supabase
    .from("articles")
    .select("id, url")
    .is("thumbnail_url", null)
    .order("ingested_at", { ascending: false })
    .limit(limit);
  const rows = data ?? [];
  if (rows.length === 0) return 0;

  let cursor = 0;
  let updated = 0;

  async function worker() {
    while (cursor < rows.length) {
      const idx = cursor++;
      const a = rows[idx] as { id: string; url: string };
      const img = await fetchOgImage(a.url).catch(() => null);
      if (img) {
        const { error } = await supabase
          .from("articles")
          .update({ thumbnail_url: img })
          .eq("id", a.id);
        if (!error) updated++;
      }
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, rows.length) }, worker);
  await Promise.all(workers);
  return updated;
}

/** Recompute featured set from current scores. */
export async function recomputeFeatured(limit = 5) {
  const supabase = createSupabaseAdmin();
  // clear current auto-featured (manual pinned via featured_slots stays)
  await supabase
    .from("articles")
    .update({ is_featured: false })
    .eq("is_featured", true);

  // pick top recent by score
  const since = new Date(Date.now() - 48 * 3600_000).toISOString();
  const { data: top } = await supabase
    .from("articles")
    .select("id, score, published_at")
    .gte("published_at", since)
    .eq("is_published", true)
    .eq("is_blacklisted", false)
    .is("dedupe_master_id", null)
    .order("score", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(limit);

  if (top && top.length) {
    await supabase
      .from("articles")
      .update({ is_featured: true })
      .in("id", top.map((a: any) => a.id));
  }
  return top?.length ?? 0;
}
