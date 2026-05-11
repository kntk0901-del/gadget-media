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

  // ---- JP-specific edge cases that previously misrouted ----
  it("keeps iPad stand product out of smartphones (魔法の板)", () => {
    const r = classify({ title: "薄さ2.5mmの「魔法の板」で、iPhoneもiPadも格段に使いやすくなったワケ" });
    expect(r.category_slug).toBe("charging");
  });
  it("keeps reminder/task-app articles out of smartphones", () => {
    const r = classify({ title: "iPhoneの純正リマインダー、タスク管理が変わる10の使い方" });
    expect(r.category_slug).toBe("other");
  });
  it("keeps HEIC-error tutorial out of smartphones", () => {
    const r = classify({ title: "なぜスマホの身分証写真アップロードで画像エラー？ iPhoneの“HEIC形式”やサイズ制限で困らないためには" });
    expect(r.category_slug).toBe("other");
  });
  it("phone-switching topic still goes to smartphones", () => {
    const r = classify({ title: "iPhone 4から毎年買い続けてきたiPhoneをやめて、Galaxy Z Fold7でAndroidに乗り換える理由" });
    expect(r.category_slug).toBe("smartphones");
  });
  it("phone-lineup ranking still goes to smartphones", () => {
    const r = classify({ title: "iPhone 14／15がiPhone SE（第3世代）に次いで人気 Back Marketのリファービッシュスマホランキング（4月）" });
    expect(r.category_slug).toBe("smartphones");
  });
  it("Makuake disclaimer does not pull non-gadgets into smartphones", () => {
    const r = classify({
      title: "首の負担を軽減する本革「フラット首輪」誕生",
      summary: "犬用本革首輪。使用するパソコン、スマートフォン等環境によって色味が異なる場合があります。",
    });
    expect(r.category_slug).not.toBe("smartphones");
  });
});
