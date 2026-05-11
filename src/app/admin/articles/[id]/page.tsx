import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentAdmin } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase/server";
import { Badge, Pill } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export default async function ArticleEditor({ params }: { params: { id: string } }) {
  if (!(await getCurrentAdmin())) redirect("/admin/login");
  const s = createSupabaseServer();
  const { data: a } = await s.from("articles").select("*, sources(name,slug), categories(name,slug)").eq("id", params.id).maybeSingle();
  if (!a) notFound();
  const { data: cats } = await s.from("categories").select("id,slug,name").order("name");

  async function save(formData: FormData) {
    "use server";
    if (!(await getCurrentAdmin())) redirect("/admin/login");
    const s = createSupabaseServer();
    await s.from("articles").update({
      title: String(formData.get("title") ?? ""),
      short_summary: String(formData.get("short_summary") ?? ""),
      editorial_note: String(formData.get("editorial_note") ?? ""),
      editorial_boost: Number(formData.get("editorial_boost") ?? 0),
      category_id: (formData.get("category_id") as string) || null,
      is_published:   formData.get("is_published")   === "on",
      is_featured:    formData.get("is_featured")    === "on",
      is_blacklisted: formData.get("is_blacklisted") === "on",
      thumbnail_url: String(formData.get("thumbnail_url") ?? "") || null,
    }).eq("id", params.id);
    revalidatePath(`/admin/articles/${params.id}`);
    revalidatePath("/");
  }

  return (
    <div className="space-y-6">
      <div>
        <Badge tone="accent">EDIT ARTICLE</Badge>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tightish line-clamp-2">{a.title}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-ink-muted">
          <Pill>id {a.id.slice(0, 8)}</Pill>
          {a.dedupe_master_id ? <Pill className="border-warn/40 text-warn">dup of {a.dedupe_master_id.slice(0,8)}</Pill> : null}
          <a href={a.url} target="_blank" rel="noopener noreferrer" className="hover:text-accent">{a.url}</a>
        </div>
      </div>

      <form action={save} className="grid gap-4">
        <Field label="Title"><textarea name="title" defaultValue={a.title} className="text-area" rows={2} /></Field>
        <Field label="Short summary (max 280)">
          <textarea name="short_summary" defaultValue={a.short_summary ?? ""} className="text-area" rows={3} maxLength={280} />
        </Field>
        <Field label="Editorial note (our own short comment)">
          <textarea name="editorial_note" defaultValue={a.editorial_note ?? ""} className="text-area" rows={3} maxLength={400} />
        </Field>
        <Field label="Thumbnail URL (optional)"><input name="thumbnail_url" defaultValue={a.thumbnail_url ?? ""} className="input" /></Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Category">
            <select name="category_id" defaultValue={a.category_id ?? ""} className="input">
              <option value="">— none —</option>
              {cats?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Editorial boost (-50..+50)">
            <input type="number" min={-50} max={50} step={1} name="editorial_boost" defaultValue={a.editorial_boost} className="input" />
          </Field>
          <Field label="Current score">
            <input readOnly value={Number(a.score).toFixed(2)} className="input opacity-60" />
          </Field>
        </div>
        <fieldset className="flex flex-wrap gap-4 rounded-xl border border-ink-line bg-bg-soft p-4">
          <Toggle name="is_published"   defaultChecked={a.is_published}   label="Published" />
          <Toggle name="is_featured"    defaultChecked={a.is_featured}    label="Featured" />
          <Toggle name="is_blacklisted" defaultChecked={a.is_blacklisted} label="Blacklist" />
        </fieldset>
        <div className="flex gap-2">
          <button className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-bg hover:bg-accent-hover">Save</button>
          <a href="/admin/articles" className="rounded-full border border-ink-line bg-bg-soft px-5 py-2 text-sm">Back</a>
        </div>
      </form>

      <style>{`
        .input    { width: 100%; border-radius: 0.5rem; border: 1px solid #23232b; background: #0a0a0c; padding: 0.5rem 0.75rem; font-size: 0.875rem; }
        .text-area{ width: 100%; border-radius: 0.5rem; border: 1px solid #23232b; background: #0a0a0c; padding: 0.5rem 0.75rem; font-size: 0.875rem; font-family: inherit; }
        .input:focus, .text-area:focus { outline: none; border-color: rgba(124,228,212,0.6); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.25em] text-ink-muted">{label}</div>
      {children}
    </label>
  );
}
function Toggle({ name, label, defaultChecked }: { name: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 accent-[#7ce4d4]" />
      {label}
    </label>
  );
}
