/**
 * Article scoring. Pure function for testability.
 *
 *   score = freshness * (source_weight * category_priority/100)
 *         + keyword_boost
 *         + editorial_boost
 *         + novelty_bonus
 *         - duplicate_penalty
 *
 * Range: typically -10 .. +40
 */

export type ScoreInput = {
  publishedAt: string | null;
  sourceWeight: number;        // 0.5 .. 1.5
  categoryPriority: number;    // 0 .. 100
  keywordBoost: number;
  editorialBoost: number;      // -50 .. +50
  novelty: number;             // 0 .. 1.5 (1.0 default)
  isDuplicate: boolean;
  isBlacklisted: boolean;
};

export function freshnessFactor(publishedAt: string | null, now = Date.now()): number {
  if (!publishedAt) return 0.4;
  const t = new Date(publishedAt).getTime();
  if (!Number.isFinite(t)) return 0.4;
  const hours = Math.max(0, (now - t) / 36e5);
  // Decay: <6h -> 1.0; 24h -> 0.75; 72h -> 0.4; 7d -> 0.15; >14d -> 0.05
  if (hours < 6)   return 1.0;
  if (hours < 24)  return 0.85;
  if (hours < 72)  return 0.55;
  if (hours < 168) return 0.25;
  if (hours < 336) return 0.10;
  return 0.05;
}

export function scoreArticle(i: ScoreInput, now = Date.now()): number {
  if (i.isBlacklisted) return -100;
  const fresh = freshnessFactor(i.publishedAt, now);
  const base  = fresh * (i.sourceWeight * (i.categoryPriority / 100)) * 20;  // ~ 0..30
  const dup   = i.isDuplicate ? 8 : 0;
  return Number((base + i.keywordBoost + i.editorialBoost + (i.novelty - 1) * 5 - dup).toFixed(3));
}
