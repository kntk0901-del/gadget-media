import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentAdmin } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase/server";
import { normalizeTitle, normalizeUrl, sha256, slugify } from "@/lib/utils";
import { Badge } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export default async function NewArticlePage() {
  if (!(await getCurrentAdmin())) redirect("/admin/login");
  const s = createSupabaseServer();
  const { data: cats } = await s.from("categories").select("id,slug,name").order("name");
  const { data: sources } = await s.from("sources").select("id,slug,name").order("name");

  async function create(formData: FormData) {
    "use server";
    if (!(await getCurrentAdmin())) redirect("/admin/login");
    const s = createSupabaseServer();
    const title = String(formData.get("title") ?? "").trim();
    const url   = normalizeUrl(String(formData.get("url") ?? ""));
    if (!title || !url) return;
    const urlHash = await sha256(url);
    const slug    = `${slugify(title)}-${urlHash.slice(0, 8)}`;

    await s.from("articles").insert({
      title,
      url,
      url_hash: urlHash,
      title_norm: normalizeTitle(title),
      slug,
      short_summary: String(formData.get("short_summary") ?? "") || null,
      editorial_note: String(formData.get("editorial_note") ?? "") || null,
      thumbnail_url: String(formData.get("thumbnail_url") ?? "") || null,
      category_id:  (formData.get("category_id") as string) || null,
      source_id:    (formData.get("source_id")   as string) || null,
      is_published: true,
      is_featured:  formData.get("is_featured") === "on",
    });
    revalidatePath("/admin/articles");
    redirect("/admin/articles");
  }

  return (
    <div className="space-y-6">
      <div>
        <Badge tone="accent">NEW</Badge>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tightish">Manual article</h1>
        <p className="text-sm text-ink-muted">Add a hand-picked outbound article (we store only metadata + short summary).</p>
      </div>

      <form action={create} className="grid gap-4">
        <Row>
          <Field label="Title"><input name="title" required className="input" /></Field>
          <Field label="Outbound URL"><input name="url" required type="url" className="input" /></Field>
        </Row>
        <Field label="Short summary (max 280)">
          <textarea name="short_summary" rows={3} maxLength={280} className="text-area" />
        </Field>
        <Field label="Editorial note">
          <textarea name="editorial_note" rows={3} maxLength={400} className="text-area" />
        </Field>
        <Row>
          <Field label="Category">
            <select name="category_id" className="input">
              <option value="">— none —</option>
              {cats?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Source">
            <select name="source_id" className="input">
              <option value="">— none —</option>
              {sources?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        </Row>
        <Field label="Thumbnail URL (optional)"><input name="thumbnail_url" className="input" /></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_featured" className="h-4 w-4 accent-[#7ce4d4]" /> Feature on home</label>
        <div><button className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-bg hover:bg-accent-hover">Create</button></div>
      </form>

      <style>{`
        .input    { width: 100%; border-radius: 0.5rem; border: 1px solid #23232b; background: #0a0a0c; padding: 0.5rem 0.75rem; font-size: 0.875rem; }
        .text-area{ width: 100%; border-radius: 0.5rem; border: 1px solid #23232b; background: #0a0a0c; padding: 0.5rem 0.75rem; font-size: 0.875rem; font-family: inherit; }
      `}</style>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) { return <div className="grid gap-3 sm:grid-cols-2">{children}</div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><div className="mb-1 font-mono text-[10px] uppercase tracking-[0.25em] text-ink-muted">{label}</div>{children}</label>;
}
