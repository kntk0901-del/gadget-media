import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase/server";
import { Badge, Pill } from "@/components/ui/primitives";
import { timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminArticlesList({ searchParams }: { searchParams: { filter?: string; q?: string } }) {
  if (!(await getCurrentAdmin())) redirect("/admin/login");
  const s = createSupabaseServer();

  let q = s.from("articles").select("id,slug,title,published_at,is_published,is_featured,is_blacklisted,dedupe_master_id,score,source_id,category_id,sources(name,slug),categories(name,slug)").order("ingested_at", { ascending: false }).limit(120);
  if (searchParams.filter === "pending")     q = q.eq("is_published", false);
  if (searchParams.filter === "featured")    q = q.eq("is_featured", true);
  if (searchParams.filter === "blacklisted") q = q.eq("is_blacklisted", true);
  if (searchParams.q) q = q.ilike("title", `%${searchParams.q.slice(0, 80)}%`);

  const { data: rows } = await q;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Badge tone="accent">ARTICLES</Badge>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tightish">Articles</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/articles/new" className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-bg hover:bg-accent-hover">+ New</Link>
        </div>
      </div>

      <form action="/admin/articles" className="flex flex-wrap gap-2">
        <input name="q" defaultValue={searchParams.q ?? ""} placeholder="Search title…" className="w-64 rounded-full border border-ink-line bg-bg-soft px-3 py-1.5 text-sm" />
        <select name="filter" defaultValue={searchParams.filter ?? ""} className="rounded-full border border-ink-line bg-bg-soft px-3 py-1.5 text-sm">
          <option value="">All</option>
          <option value="pending">Pending review</option>
          <option value="featured">Featured</option>
          <option value="blacklisted">Blacklisted</option>
        </select>
        <button className="rounded-full border border-ink-line bg-bg-elev px-4 py-1.5 text-sm">Apply</button>
      </form>

      <div className="rounded-xl border border-ink-line bg-bg-soft overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bg-elev text-[11px] uppercase tracking-[0.2em] text-ink-muted">
            <tr>
              <th className="px-3 py-2 text-left">Title</th>
              <th className="px-3 py-2 text-left">Source</th>
              <th className="px-3 py-2 text-left">Category</th>
              <th className="px-3 py-2 text-right">Score</th>
              <th className="px-3 py-2 text-left">State</th>
              <th className="px-3 py-2 text-right">Published</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((r: any) => (
              <tr key={r.id} className="border-t border-ink-line hover:bg-bg-elev/50">
                <td className="px-3 py-2">
                  <Link href={`/admin/articles/${r.id}`} className="line-clamp-1 hover:text-accent">{r.title}</Link>
                </td>
                <td className="px-3 py-2 text-ink-soft">{r.sources?.name ?? "—"}</td>
                <td className="px-3 py-2 text-ink-soft">{r.categories?.name ?? "—"}</td>
                <td className="px-3 py-2 text-right font-mono">{Number(r.score).toFixed(2)}</td>
                <td className="px-3 py-2 space-x-1">
                  {r.is_featured && <Pill className="border-accent/40 text-accent">featured</Pill>}
                  {r.is_published ? <Pill>published</Pill> : <Pill className="border-warn/40 text-warn">draft</Pill>}
                  {r.is_blacklisted && <Pill className="border-live/40 text-live">blocked</Pill>}
                  {r.dedupe_master_id && <Pill>dup</Pill>}
                </td>
                <td className="px-3 py-2 text-right font-mono text-[12px] text-ink-muted">{timeAgo(r.published_at)}</td>
              </tr>
            ))}
            {!rows?.length && <tr><td colSpan={6} className="px-3 py-8 text-center text-ink-muted">No articles match.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
