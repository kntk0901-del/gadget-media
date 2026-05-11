import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export type GuideFaq = { q: string; a: string };

export type GuidePhone = {
  name: string;
  brand: "apple" | "samsung" | "google" | "sony" | "xiaomi" | "oneplus" | "nothing" | string;
  color: string;   // hex body color
  accent: string;  // hex accent (screen / highlight)
  tagline: string;
  bestFor: string;
  price?: string;
};

export type GuideUseCase = {
  icon: "camera" | "gaming" | "battery" | "ai" | "compact" | "cost" | "foldable" | string;
  label: string;
  pick: string;
  runner?: string;
};

export type GuideFrontmatter = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  author: string;
  heroImage?: string;
  heroVariant?: string;
  tags?: string[];
  relatedCategories?: string[];
  faqs?: GuideFaq[];
  phones?: GuidePhone[];
  useCases?: GuideUseCase[];
};

export type Guide = {
  frontmatter: GuideFrontmatter;
  body: string;
};

const GUIDES_DIR = path.join(process.cwd(), "src", "content", "guides");

function readGuideFile(slug: string): Guide | null {
  const filePath = path.join(GUIDES_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = matter(raw);
  return {
    frontmatter: { ...(parsed.data as any), slug } as GuideFrontmatter,
    body: parsed.content,
  };
}

export function getAllGuides(): Guide[] {
  if (!fs.existsSync(GUIDES_DIR)) return [];
  return fs
    .readdirSync(GUIDES_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => readGuideFile(f.replace(/\.md$/, "")))
    .filter((g): g is Guide => !!g)
    .sort((a, b) => (b.frontmatter.publishedAt || "").localeCompare(a.frontmatter.publishedAt || ""));
}

export function getGuideBySlug(slug: string): Guide | null {
  return readGuideFile(slug);
}

/** Guides that declare `relatedCategories` containing the given category slug. */
export function getGuidesForCategory(categorySlug: string): Guide[] {
  return getAllGuides().filter((g) =>
    (g.frontmatter.relatedCategories ?? []).includes(categorySlug)
  );
}
