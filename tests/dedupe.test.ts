import { describe, it, expect } from "vitest";
import { findDuplicate } from "../src/lib/ingestion/dedupe";
import { normalizeTitle } from "../src/lib/utils";

describe("findDuplicate", () => {
  const existing = {
    id: "a", url_hash: "111", title_norm: normalizeTitle("Anker launches new 100W GaN charger"),
    published_at: new Date().toISOString(),
  };
  it("detects exact url match", () => {
    const r = findDuplicate({ urlHash: "111", title: "totally different", publishedAt: null, candidates: [existing] });
    expect(r.kind).toBe("exact_url");
  });
  it("detects near-duplicate title", () => {
    const r = findDuplicate({
      urlHash: "222",
      title: "Anker launches the new 100W GaN charger today",
      publishedAt: new Date().toISOString(),
      candidates: [existing],
    });
    expect(r.kind === "near_title" || r.kind === "same_topic_recent").toBe(true);
  });
  it("returns new for unrelated", () => {
    const r = findDuplicate({ urlHash: "333", title: "Specialized announces new e-bike", publishedAt: null, candidates: [existing] });
    expect(r.kind).toBe("new");
  });
});
