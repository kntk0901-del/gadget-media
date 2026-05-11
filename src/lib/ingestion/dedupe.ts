import { jaccard, normalizeTitle, sha256 } from "../utils";

export type DedupeCandidate = {
  id: string;
  title_norm: string;
  url_hash: string;
  published_at: string | null;
};

export type DedupeResult =
  | { kind: "new" }
  | { kind: "exact_url"; masterId: string }
  | { kind: "near_title"; masterId: string; similarity: number }
  | { kind: "same_topic_recent"; masterId: string; similarity: number };

const NEAR_TITLE_THRESHOLD = 0.82;
const SAME_TOPIC_THRESHOLD = 0.60;
const SAME_TOPIC_WINDOW_HOURS = 36;

export async function urlHashFor(normalizedUrl: string): Promise<string> {
  return sha256(normalizedUrl);
}

export function findDuplicate(params: {
  urlHash: string;
  title: string;
  publishedAt: string | null;
  candidates: DedupeCandidate[];
}): DedupeResult {
  const { urlHash, title, publishedAt, candidates } = params;

  // 1. exact url
  const exact = candidates.find((c) => c.url_hash === urlHash);
  if (exact) return { kind: "exact_url", masterId: exact.id };

  const titleNorm = normalizeTitle(title);
  if (!titleNorm) return { kind: "new" };

  // 2. near-duplicate title
  let bestNear: { id: string; sim: number } | null = null;
  for (const c of candidates) {
    if (!c.title_norm) continue;
    const sim = jaccard(titleNorm, c.title_norm);
    if (sim >= NEAR_TITLE_THRESHOLD && (!bestNear || sim > bestNear.sim)) {
      bestNear = { id: c.id, sim };
    }
  }
  if (bestNear) return { kind: "near_title", masterId: bestNear.id, similarity: bestNear.sim };

  // 3. same-topic recent
  if (publishedAt) {
    const t = new Date(publishedAt).getTime();
    let bestTopic: { id: string; sim: number } | null = null;
    for (const c of candidates) {
      if (!c.published_at) continue;
      const dt = new Date(c.published_at).getTime();
      if (Math.abs(t - dt) / 36e5 > SAME_TOPIC_WINDOW_HOURS) continue;
      const sim = jaccard(titleNorm, c.title_norm);
      if (sim >= SAME_TOPIC_THRESHOLD && (!bestTopic || sim > bestTopic.sim)) {
        bestTopic = { id: c.id, sim };
      }
    }
    if (bestTopic) return { kind: "same_topic_recent", masterId: bestTopic.id, similarity: bestTopic.sim };
  }

  return { kind: "new" };
}
