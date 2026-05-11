import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentAdmin } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/primitives";
import { timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminFeatured() {
  if (!(await getCurrentAdmin())) redirect("/admin/login");
  const s = createSupabaseServer();
  const { data: slots } = await s.from("featured_slots").select("*, articles(id,slug,title,is_published)").order("position");
  const { data: candidates } = await s.from("article_cards")
    .select("id,slug,title,source_name,score,published_at")
    .order("score", { ascending: false }).order("published_at", { ascending: false }).limit(20);

  async function assign(formData: FormData) {
    "use server";
    if (!(await getCurrentAdmin())) redirect("/admin/login");
    const s = createSupabaseServer();
    const pos = Number(formData.get("position"));
    const articleId = (formData.get("article_id") as string) || null;
    await s.from("featured_slots").update({ article_id: articleId, updated_at: new Date().toISOString() }).eq("position", pos);
    if (articleId) await s.from("articles").update({ is_featured: true }).eq("id", articleId);
    revalidatePath("/admin/featured");
    revalidatePath("/");
  }

  async function clear(formData: FormData) {
    "use server";
    if (!(await getCurrentAdmin())) redirect("/admin/login");
    const s = createSupabaseServer();
    await s.from("featured_slots").update({ article_id: null }).eq("position", Number(formData.get("position")));
    revalidatePath("/admin/featured");
  }

  return (
    <div className="space-y-8">
      <div>
        <Badge tone="accent">FEATURED</Badge>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tightish">Featured slots</h1>
        <p className="mt-1 text-sm text-ink-muted">Manual pins for Today's picks. Cron also auto-features the top-scored stories.</p>
      </div>

      <div className="grid gap-3">
        {(slots ?? []).map((slot: any) => (
          <div key={slot.id} className="rounded-xl border border-ink-line bg-bg-soft p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Slot #{slot.position}</div>
              <div className="text-sm text-ink-soft">{slot.note}</div>
            </div>
            {slot.articles ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-ink-line bg-bg p-3">
                <div className="line-clamp-1 text-sm">{slot.articles.title}</div>
                <form action={clear}>
                  <input type="hidden" name="position" value={slot.position} />
                  <button className="rounded-full border border-live/40 bg-live/10 px-3 py-1 text-xs text-live">Clear</button>
                </form>
              </div>
            ) : (
              <form action={assign} className="flex gap-2">
                <input type="hidden" name="position" value={slot.position} />
                <select name="article_id" className="input">
                  <option value="">— pick top candidate —</option>
                  {(candidates ?? []).map((c: any) => (
                    <option key={c.id} value={c.id}>{c.title.slice(0, 80)} · {c.source_name}</option>
                  ))}
                </select>
                <button className="rounded-full bg-accent px-4 py-1 text-xs font-medium text-bg">Pin</button>
              </form>
            )}
          </div>
        ))}
      </div>

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold">Top candidates</h2>
        <div className="rounded-xl border border-ink-line bg-bg-soft overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-bg-elev text-[11px] uppercase tracking-[0.2em] text-ink-muted">
              <tr><th className="px-3 py-2 text-left">Title</th><th className="px-3 py-2 text-left">Source</th><th className="px-3 py-2 text-right">Score</th><th className="px-3 py-2 text-right">Pub</th></tr>
            </thead>
            <tbody>
              {(candidates ?? []).map((c: any) => (
                <tr key={c.id} className="border-t border-ink-line">
                  <td className="px-3 py-2 line-clamp-1">{c.title}</td>
                  <td className="px-3 py-2 text-ink-soft">{c.source_name}</td>
                  <td className="px-3 py-2 text-right font-mono">{Number(c.score).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right text-[12px] text-ink-muted">{timeAgo(c.published_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <style>{`.input{width:100%;border-radius:0.5rem;border:1px solid #23232b;background:#0a0a0c;padding:0.5rem 0.75rem;font-size:0.875rem;}`}</style>
    </div>
  );
}
