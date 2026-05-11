import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase/server";
import { Badge, SectionHeader } from "@/components/ui/primitives";
import { timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  const s = createSupabaseServer();
  const [{ count: articlesCount }, { count: sourcesCount }, { count: catCount }, { data: recentLogs }, { data: pending }] = await Promise.all([
    s.from("articles").select("*", { count: "exact", head: true }),
    s.from("sources").select("*", { count: "exact", head: true }),
    s.from("categories").select("*", { count: "exact", head: true }),
    s.from("ingest_logs").select("*").order("started_at", { ascending: false }).limit(6),
    s.from("articles").select("id,slug,title,is_published,dedupe_master_id,published_at").eq("is_published", false).order("ingested_at", { ascending: false }).limit(10),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <Badge tone="accent">DASHBOARD</Badge>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tightish">Welcome back</h1>
        <p className="mt-1 text-sm text-ink-muted">{admin.user.email} · role: {admin.role}</p>
      </div>

      <section className="grid gap-3 sm:grid-cols-4">
        <Stat label="Articles" value={articlesCount ?? 0} />
        <Stat label="Sources"  value={sourcesCount  ?? 0} />
        <Stat label="Categories" value={catCount ?? 0} />
        <Stat label="Pending review" value={pending?.length ?? 0} accent />
      </section>

      <section>
        <SectionHeader tag="A" title="Pending review (auto-quarantined)" accessory={<Link href="/admin/articles?filter=pending" className="hover:text-accent">All →</Link>} />
        <ul className="divide-y divide-ink-line rounded-xl border border-ink-line bg-bg-soft">
          {(pending ?? []).map((p: any) => (
            <li key={p.id} className="flex items-center justify-between px-4 py-3">
              <Link href={`/admin/articles/${p.id}`} className="line-clamp-1 text-sm text-ink hover:text-accent">{p.title}</Link>
              <span className="font-mono text-[11px] text-ink-muted">{timeAgo(p.published_at)}</span>
            </li>
          ))}
          {(!pending || pending.length === 0) && (
            <li className="px-4 py-6 text-center text-sm text-ink-muted">Nothing to review.</li>
          )}
        </ul>
      </section>

      <section>
        <SectionHeader tag="B" title="Recent ingest runs" accessory={<Link href="/admin/logs" className="hover:text-accent">All →</Link>} />
        <div className="rounded-xl border border-ink-line bg-bg-soft overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-bg-elev text-[11px] uppercase tracking-[0.2em] text-ink-muted">
              <tr><th className="px-3 py-2 text-left">Started</th><th className="px-3 py-2 text-left">Status</th><th className="px-3 py-2 text-right">Created</th><th className="px-3 py-2 text-right">Skipped</th><th className="px-3 py-2 text-right">Errors</th></tr>
            </thead>
            <tbody>
              {(recentLogs ?? []).map((l: any) => (
                <tr key={l.id} className="border-t border-ink-line">
                  <td className="px-3 py-2 font-mono text-[12px]">{l.started_at?.replace("T"," ").slice(0,16)}</td>
                  <td className="px-3 py-2">{l.status}</td>
                  <td className="px-3 py-2 text-right">{l.created_count}</td>
                  <td className="px-3 py-2 text-right">{l.skipped_count}</td>
                  <td className="px-3 py-2 text-right">{l.error_count}</td>
                </tr>
              ))}
              {(!recentLogs || recentLogs.length === 0) && (
                <tr><td colSpan={5} className="px-3 py-6 text-center text-ink-muted">No runs yet. Trigger one from /admin/logs.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number | string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border ${accent ? "border-accent/40 bg-accent/5" : "border-ink-line bg-bg-soft"} p-4`}>
      <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-ink-muted">{label}</div>
      <div className="mt-1 font-display text-3xl font-bold tracking-tightish">{value}</div>
    </div>
  );
}
