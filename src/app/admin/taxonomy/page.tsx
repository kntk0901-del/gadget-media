import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentAdmin } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import { Badge, Pill } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export default async function AdminTaxonomy() {
  if (!(await getCurrentAdmin())) redirect("/admin/login");
  const s = createSupabaseServer();
  const { data: categories } = await s.from("categories").select("*").order("priority", { ascending: false });
  const { data: tags } = await s.from("tags").select("*").order("name");

  async function addCategory(formData: FormData) {
    "use server";
    if (!(await getCurrentAdmin())) redirect("/admin/login");
    const s = createSupabaseServer();
    await s.from("categories").insert({
      name: String(formData.get("name") ?? ""),
      slug: slugify(String(formData.get("slug") ?? formData.get("name") ?? "")),
      priority: Number(formData.get("priority") ?? 50),
      is_primary: formData.get("is_primary") === "on",
      description: String(formData.get("description") ?? "") || null,
    });
    revalidatePath("/admin/taxonomy");
  }
  async function updateCategoryPriority(formData: FormData) {
    "use server";
    if (!(await getCurrentAdmin())) redirect("/admin/login");
    const s = createSupabaseServer();
    await s.from("categories").update({ priority: Number(formData.get("priority")) }).eq("id", String(formData.get("id")));
    revalidatePath("/admin/taxonomy");
  }
  async function addTag(formData: FormData) {
    "use server";
    if (!(await getCurrentAdmin())) redirect("/admin/login");
    const s = createSupabaseServer();
    await s.from("tags").insert({
      name: String(formData.get("name") ?? ""),
      slug: slugify(String(formData.get("slug") ?? formData.get("name") ?? "")),
      kind: String(formData.get("kind") ?? "topic"),
    });
    revalidatePath("/admin/taxonomy");
  }

  return (
    <div className="space-y-10">
      <div>
        <Badge tone="accent">TAXONOMY</Badge>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tightish">Categories & tags</h1>
      </div>

      <section>
        <h2 className="font-display text-lg font-semibold mb-3">Categories</h2>
        <form action={addCategory} className="mb-4 grid gap-2 rounded-xl border border-ink-line bg-bg-soft p-4 sm:grid-cols-5">
          <input name="name" required placeholder="Name" className="input" />
          <input name="slug" placeholder="slug" className="input" />
          <input name="priority" type="number" defaultValue={50} className="input" />
          <input name="description" placeholder="description" className="input sm:col-span-2" />
          <label className="flex items-center gap-2 text-sm"><input name="is_primary" type="checkbox" className="h-4 w-4 accent-[#7ce4d4]" /> primary</label>
          <button className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-bg">+ Add</button>
        </form>

        <div className="rounded-xl border border-ink-line bg-bg-soft overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-bg-elev text-[11px] uppercase tracking-[0.2em] text-ink-muted">
              <tr><th className="px-3 py-2 text-left">Name</th><th className="px-3 py-2 text-left">Slug</th><th className="px-3 py-2 text-left">Description</th><th className="px-3 py-2 text-right">Priority</th><th /></tr>
            </thead>
            <tbody>
              {(categories ?? []).map((c: any) => (
                <tr key={c.id} className="border-t border-ink-line">
                  <td className="px-3 py-2">{c.name} {c.is_primary && <Pill className="border-accent/40 text-accent">primary</Pill>}</td>
                  <td className="px-3 py-2 font-mono text-[12px] text-ink-soft">{c.slug}</td>
                  <td className="px-3 py-2 text-ink-soft line-clamp-1">{c.description}</td>
                  <td className="px-3 py-2 text-right">
                    <form action={updateCategoryPriority} className="flex justify-end gap-1">
                      <input type="hidden" name="id" value={c.id} />
                      <input name="priority" defaultValue={c.priority} type="number" className="w-16 rounded border border-ink-line bg-bg px-2 py-0.5 text-right text-sm" />
                      <button className="rounded border border-ink-line bg-bg-elev px-2 py-0.5 text-xs">save</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold mb-3">Tags</h2>
        <form action={addTag} className="mb-4 flex gap-2 rounded-xl border border-ink-line bg-bg-soft p-4">
          <input name="name" required placeholder="name" className="input" />
          <input name="slug" placeholder="slug" className="input" />
          <select name="kind" defaultValue="topic" className="input">
            <option value="topic">topic</option><option value="brand">brand</option><option value="tech">tech</option>
          </select>
          <button className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-bg">+ Add</button>
        </form>
        <div className="flex flex-wrap gap-2">
          {(tags ?? []).map((t: any) => (
            <Pill key={t.id} className="border-ink-line">
              <span className="text-ink-soft">{t.kind}/</span>{t.slug}
            </Pill>
          ))}
        </div>
      </section>

      <style>{`.input{width:100%;border-radius:0.5rem;border:1px solid #23232b;background:#0a0a0c;padding:0.5rem 0.75rem;font-size:0.875rem;}`}</style>
    </div>
  );
}
