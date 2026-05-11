import { XMLParser } from "fast-xml-parser";

export type FetchedItem = {
  title: string;
  url: string;
  published_at: string | null;
  summary: string | null;
  thumbnail_url: string | null;
  author: string | null;
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  trimValues: true,
  parseTagValue: true,
  // Disable parser entity handling — we decode &amp; &#XX; ourselves below.
  // This avoids the "Entity expansion limit exceeded" error from feeds like DPReview.
  processEntities: false,
  htmlEntities: false,
  numberParseOptions: { leadingZeros: false, hex: false, eNotation: false },
  removeNSPrefix: true,
});

function preprocessXml(s: string): string {
  // Strip <!DOCTYPE ...> blocks (sometimes huge, with <!ENTITY> declarations).
  return s.replace(/<!DOCTYPE[\s\S]*?(?:\[[\s\S]*?\])?\s*>/i, "");
}

function pick<T = any>(...vals: T[]): T | null {
  for (const v of vals) if (v !== undefined && v !== null && v !== "") return v;
  return null;
}

// fast-xml-parser may return objects (e.g. CDATA wrappers) or numbers — coerce.
function toText(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (typeof v === "object") {
    const o = v as any;
    if (typeof o["#text"] === "string") return o["#text"];
    if (typeof o.toString === "function") {
      const s = o.toString();
      if (s && s !== "[object Object]") return s;
    }
  }
  return null;
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", hellip: "…",
  mdash: "—", ndash: "–", copy: "©", reg: "®", trade: "™",
};

function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => {
      const c = parseInt(h, 16);
      return Number.isFinite(c) ? String.fromCodePoint(c) : "";
    })
    .replace(/&#(\d+);/g, (_, d) => {
      const c = parseInt(d, 10);
      return Number.isFinite(c) ? String.fromCodePoint(c) : "";
    })
    .replace(/&([a-zA-Z]+);/g, (m, n) => NAMED_ENTITIES[n] ?? m);
}

function stripHtml(v: unknown): string | null {
  const s = toText(v);
  if (!s) return null;
  // Decode entities FIRST — feeds often double-encode (`&lt;img src=...&gt;`).
  // Then strip HTML tags, then collapse whitespace.
  return decodeEntities(s).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || null;
}

function findImage(item: any): string | null {
  const enclosure = item.enclosure;
  if (enclosure?.["@_url"] && /image|jpg|jpeg|png|webp/i.test(enclosure["@_type"] || enclosure["@_url"])) return enclosure["@_url"];
  const mediaContent = item["media:content"];
  if (mediaContent?.["@_url"]) return mediaContent["@_url"];
  if (Array.isArray(mediaContent) && mediaContent[0]?.["@_url"]) return mediaContent[0]["@_url"];
  const thumb = item["media:thumbnail"];
  if (thumb?.["@_url"]) return thumb["@_url"];
  if (Array.isArray(thumb) && thumb[0]?.["@_url"]) return thumb[0]["@_url"];
  // Description may be entity-encoded HTML — decode before pulling img src
  const html = toText(item["content:encoded"]) || toText(item.content) || toText(item.description);
  if (html) {
    const decoded = decodeEntities(html);
    const m = decoded.match(/<img[^>]+src=["']([^"']+)/i);
    if (m) return m[1];
  }
  return null;
}

function parseDate(s: any): string | null {
  if (!s) return null;
  const v = typeof s === "string" ? s : String(s);
  const d = new Date(v);
  return Number.isFinite(d.getTime()) ? d.toISOString() : null;
}

export async function fetchFeed(url: string, timeoutMs = 15000): Promise<FetchedItem[]> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctl.signal,
      headers: {
        // Some sites (NotebookCheck) block default fetch UA; use a browsery one.
        "user-agent": "Mozilla/5.0 (compatible; GadgetMediaBot/0.1; +https://gadget-wire.example)",
        accept: "application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.9, */*;q=0.8",
      },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
    const rawXml = await res.text();
    const xml = preprocessXml(rawXml);
    const j = parser.parse(xml);
    const items: FetchedItem[] = [];

    // RSS 2.0
    const rssItems = j?.rss?.channel?.item;
    if (rssItems) {
      const arr = Array.isArray(rssItems) ? rssItems : [rssItems];
      for (const it of arr) {
        const link =
          (typeof it.link === "string" && it.link) ||
          it.link?.["@_href"] ||
          (typeof it.guid === "string" ? it.guid : it.guid?.["#text"]);
        if (!link || typeof link !== "string") continue;
        items.push({
          title: stripHtml(it.title) || "",
          url: link,
          published_at: parseDate(toText(it.pubDate) || toText(it.published) || toText(it.updated) || toText(it.date)),
          summary: stripHtml(pick(it.description, it["content:encoded"], it.summary)),
          thumbnail_url: findImage(it),
          author: stripHtml(pick(it["dc:creator"], it.author?.name, it.author)),
        });
      }
    }

    // Atom
    const atomItems = j?.feed?.entry;
    if (atomItems) {
      const arr = Array.isArray(atomItems) ? atomItems : [atomItems];
      for (const it of arr) {
        const linkRaw = Array.isArray(it.link)
          ? it.link.find((l: any) => l["@_rel"] === "alternate") || it.link[0]
          : it.link;
        const link = typeof linkRaw === "string" ? linkRaw : linkRaw?.["@_href"];
        if (!link) continue;
        items.push({
          title: stripHtml(it.title) || "",
          url: link,
          published_at: parseDate(toText(it.published) || toText(it.updated)),
          summary: stripHtml(pick(it.summary, it.content)),
          thumbnail_url: findImage(it),
          author: stripHtml(pick(it.author?.name, it.author)),
        });
      }
    }

    return items.filter((x) => x.title && x.url);
  } finally {
    clearTimeout(t);
  }
}

/**
 * Fallback image extractor: fetch the article page and read its og:image meta.
 *
 * Used when the RSS feed doesn't expose an image (ITmedia, Impress Watch, etc.).
 * Bounded by a tight timeout and a Range request to keep cost down.
 */
const OG_PATTERNS: RegExp[] = [
  /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
  /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i,
  /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i,
  /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/i,
  /<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i,
];

export async function fetchOgImage(url: string, timeoutMs = 3500): Promise<string | null> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctl.signal,
      redirect: "follow",
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; GadgetMediaBot/0.1; +https://gadget-wire.example)",
        accept: "text/html,application/xhtml+xml",
        "accept-language": "ja,en;q=0.8",
        // Most sites honour Range and reply 206 — saves bandwidth and time.
        range: "bytes=0-131071",
      },
      cache: "no-store",
    });
    if (!res.ok && res.status !== 206) return null;
    const ct = res.headers.get("content-type") || "";
    if (!/html|xml/i.test(ct)) return null;

    // Read at most ~200KB regardless of server cooperation with Range.
    const text = (await res.text()).slice(0, 200_000);

    for (const rx of OG_PATTERNS) {
      const m = rx.exec(text);
      if (m && m[1]) {
        let img = m[1].trim().replace(/&amp;/g, "&");
        if (img.startsWith("//")) img = "https:" + img;
        else if (img.startsWith("/")) {
          try { img = new URL(img, url).toString(); } catch { /* keep */ }
        }
        try { new URL(img); } catch { return null; }
        // ignore obvious 1×1 trackers / logos
        if (/spacer|pixel\.gif|blank\.gif/i.test(img)) continue;
        return img;
      }
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}
