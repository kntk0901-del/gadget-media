import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentAdmin } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase/server";
import { Badge, Pill } from "@/components/ui/primitives";
import { slugify, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminSources() {
  if (!(await getCurrentAdmin())) redirect("/admin/login");
  const s = createSupabaseServer();
  const { data: sources } = await s.from("sources").select("*").order("name");

  async function upsert(formData: FormData) {
    "use server";
    if (!(await getCurrentAdmin())) redirect("/admin/login");
    const s = createSupabaseServer();
    const id = (formData.get("id") as string) || null;
    const payload = {
      name: String(formData.get("name") ?? ""),
      slug: slugify(String(formData.get("slug") ?? formData.get("name") ?? "")),
      homepage_url: String(formData.get("homepage_url") ?? "") || null,
      feed_url: String(formData.get("feed_url") ?? "") || null,
      feed_kind: String(formData.get("feed_kind") ?? "rss"),
      weight: Number(formData.get("weight") ?? 1),
      is_enabled: formData.get("is_enabled") === "on",
      language: String(formData.get("language") ?? "en"),
    };
    if (id) await s.from("sources").update(payload).eq("id", id);
    else    await s.from("sources").insert(payload);
    revalidatePath("/admin/sources");
  }

  async function toggleEnabled(formData: FormData) {
    "use server";
    if (!(await getCurrentAdmin())) redirect("/admin/login");
    const s = createSupabaseServer();
    const id = String(formData.get("id"));
    const enabled = formData.get("enabled") === "true";
    await s.from("sources").update({ is_enabled: !enabled }).eq("id", id);
    revalidatePath("/admin/sources");
  }

  return (
    <div className="space-y-6">
      <div>
        <Badge tone="accent">SOURCES</Badge>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tightish">Sources</h1>
      </div>

      <form action={upsert} className="rounded-xl border border-ink-line bg-bg-soft p-4 grid gap-3 sm:grid-cols-3">
        <input name="name" required placeholder="Display name" className="input" />
        <input name="slug" placeholder="slug (optional)" className="input" />
        <input name="feed_url" required placeholder="RSS / Atom feed URL" className="input sm:col-span-2" />
        <input name="homepage_url" placeholder="Homepage URL" className="input" />
        <select name="feed_kind" defaultValue="rss" className="input">
          <option value="rss">RSS</option>
          <option value="atom">Atom</option>
          <option value="json">JSON Feed</option>
          <option value="api">API</option>
          <option value="manual">Manual</option>
        </select>
        <input name="language" defaultValue="en" placeholder="lang" className="input" />
        <input name="weight" defaultValue="1.0" type="number" step="0.05" min="0.1" max="2" className="input" />
        <label className="flex items-center gap-2 text-sm"><input name="is_enabled" type="checkbox" defaultChecked className="h-4 w-4 accent-[#7ce4d4]" /> enabled</label>
        <div><button className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-bg">+ Add source</button></div>
      </form>

      <div className="rounded-xl border border-ink-line bg-bg-soft overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bg-elev text-[11px] uppercase tracking-[0.2em] text-ink-muted">
            <tr><th className="px-3 py-2 text-left">Name</th><th className="px-3 py-2 text-left">Feed</th><th className="px-3 py-2 text-right">Weight</th><th className="px-3 py-2 text-left">State</th><th className="px-3 py-2 text-right">Last ingest</th><th className="px-3 py-2"/></tr>
          </thead>
          <tbody>
            {(sources ?? []).map((src: any) => (
              <tr key={src.id} className="border-t border-ink-line">
                <td className="px-3 py-2"><div className="font-medium">{src.name}</div><div className="font-mono text-[11px] text-ink-muted">{src.slug}</div></td>
                <td className="px-3 py-2"><a className="text-ink-soft hover:text-accent line-clamp-1" target="_blank" rel="noopener noreferrer" href={src.feed_url ?? "#"}>{src.feed_url}</a></td>
                <td className="px-3 py-2 text-right font-mono">{Number(src.weight).toFixed(2)}</td>
                <td className="px-3 py-2">{src.is_enabled ? <Pill className="border-accent/40 text-accent">enabled</Pill> : <Pill className="border-warn/40 text-warn">disabled</Pill>}</td>
                <td className="px-3 py-2 text-right text-[12px] text-ink-muted">{timeAgo(src.last_ingest_at)}</td>
                <td className="px-3 py-2 text-right">
                  <form action={toggleEnabled}>
                    <input type="hidden" name="id" value={src.id} />
                    <input type="hidden" name="enabled" value={src.is_enabled ? "true" : "false"} />
                    <button className="rounded-full border border-ink-line bg-bg-elev px-3 py-1 text-xs hover:border-accent/40">Toggle</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        .input { width: 100%; border-radius: 0.5rem; border: 1px solid #23232b; background: #0a0a0c; padding: 0.5rem 0.75rem; font-size: 0.875rem; }
      `}</style>
    </div>
  );
}
