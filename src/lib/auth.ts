import { createSupabaseServer } from "./supabase/server";

export async function getCurrentAdmin() {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: row } = await supabase
    .from("admin_users")
    .select("user_id, role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!row) return null;
  return { user, role: row.role as "editor" | "admin" };
}
