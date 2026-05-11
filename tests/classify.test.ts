import { describe, it, expect } from "vitest";
import { classify } from "../src/lib/ingestion/classify";

describe("classify", () => {
  it("blacklists politics", () => {
    const r = classify({ title: "Senate hearing on data privacy" });
    expect(r.is_blacklisted).toBe(true);
  });
  it("rejects pure software/AI app news", () => {
    const r = classify({ title: "ChatGPT now has new prompt engineering features" });
    expect(r.is_blacklisted).toBe(true);
  });
  it("routes iPhone news to smartphones with apple+iphone tags", () => {
    const r = classify({ title: "iPhone 17 Pro lineup leaks ahead of launch" });
    expect(r.category_slug).toBe("smartphones");
    expect(r.tags).toContain("iphone");
    expect(r.tags).toContain("apple");
    expect(r.is_relevant).toBe(true);
  });
  it("routes GaN charger to charging with GaN tag", () => {
    const r = classify({ title: "Anker launches new 100W GaN charger" });
    expect(r.category_slug).toBe("charging");
    expect(r.tags).toContain("gan");
  });
  it("routes e-bike news to ebikes", () => {
    const r = classify({ title: "Specialized debuts mid-drive e-bike with 90Nm motor" });
    expect(r.category_slug).toBe("ebikes");
    expect(r.tags).toContain("ebike");
  });
  it("classifies robot vacuum as robotics", () => {
    const r = classify({ title: "Roborock S9 robot vacuum review" });
    expect(r.category_slug).toBe("robotics");
  });
  it("returns is_relevant=false for generic content", () => {
    const r = classify({ title: "Generic lifestyle news about weekend trips" });
    expect(r.is_relevant).toBe(false);
    expect(r.category_slug).toBeNull();
  });
});
