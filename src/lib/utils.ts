import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = "";
    // strip common trackers
    const drop = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid", "mc_cid", "mc_eid"];
    drop.forEach((k) => u.searchParams.delete(k));
    // sort params for stable hash
    const entries = Array.from(u.searchParams.entries()).sort(([a], [b]) => a.localeCompare(b));
    u.search = "";
    entries.forEach(([k, v]) => u.searchParams.append(k, v));
    let s = u.toString();
    if (s.endsWith("/")) s = s.slice(0, -1);
    return s;
  } catch {
    return url.trim();
  }
}

export function normalizeTitle(t: string): string {
  return t
    .toLowerCase()
    .replace(/[–—−]/g, "-")
    .replace(/[‘’“”]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function sha256(s: string): Promise<string> {
  const data = new TextEncoder().encode(s);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "—";
  const diff = Date.now() - t;
  const m = Math.round(diff / 60000);
  if (m < 1) return "たった今";
  if (m < 60) return `${m} 分前`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} 時間前`;
  const d = Math.round(h / 24);
  if (d < 14) return `${d} 日前`;
  return new Date(iso).toISOString().slice(0, 10);
}

export function clampSummary(s: string | null | undefined, max = 240): string {
  if (!s) return "";
  const clean = s.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).trimEnd() + "…";
}

export function jaccard(a: string, b: string): number {
  const ta = new Set(a.split(" ").filter((w) => w.length > 2));
  const tb = new Set(b.split(" ").filter((w) => w.length > 2));
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  ta.forEach((w) => { if (tb.has(w)) inter++; });
  return inter / (ta.size + tb.size - inter);
}
