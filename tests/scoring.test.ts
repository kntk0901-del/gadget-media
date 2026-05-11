import { describe, it, expect } from "vitest";
import { freshnessFactor, scoreArticle } from "../src/lib/ingestion/scoring";

describe("freshnessFactor", () => {
  it("recent posts get max freshness", () => {
    const now = Date.now();
    const recent = new Date(now - 60_000).toISOString();
    expect(freshnessFactor(recent, now)).toBe(1.0);
  });
  it("week-old posts get low freshness", () => {
    const now = Date.now();
    const old = new Date(now - 7 * 24 * 3600 * 1000).toISOString();
    expect(freshnessFactor(old, now)).toBeLessThan(0.2);
  });
});

describe("scoreArticle", () => {
  it("blacklisted is negative", () => {
    const s = scoreArticle({
      publishedAt: new Date().toISOString(),
      sourceWeight: 1, categoryPriority: 90, keywordBoost: 5,
      editorialBoost: 0, novelty: 1, isDuplicate: false, isBlacklisted: true,
    });
    expect(s).toBeLessThan(0);
  });
  it("duplicate penalty applied", () => {
    const base = { publishedAt: new Date().toISOString(), sourceWeight: 1, categoryPriority: 90, keywordBoost: 5, editorialBoost: 0, novelty: 1, isBlacklisted: false };
    const a = scoreArticle({ ...base, isDuplicate: false });
    const b = scoreArticle({ ...base, isDuplicate: true });
    expect(a).toBeGreaterThan(b);
  });
});
