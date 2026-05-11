"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/primitives";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const supabase = createSupabaseBrowser();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-bg bg-grid">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-ink-line bg-bg-soft p-8 shadow-card">
        <Badge tone="accent">ADMIN</Badge>
        <h1 className="mt-4 font-display text-2xl font-bold tracking-tightish">Sign in</h1>
        <p className="mt-1 text-sm text-ink-muted">Editorial console for the curated gadget feed.</p>
        <div className="mt-6 space-y-3">
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-ink-line bg-bg px-3 py-2 text-sm focus:outline-none focus:border-accent/60"
          />
          <input
            type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg border border-ink-line bg-bg px-3 py-2 text-sm focus:outline-none focus:border-accent/60"
          />
          {err ? <div className="text-xs text-live">{err}</div> : null}
          <button disabled={busy} className="w-full rounded-lg bg-accent py-2 text-sm font-semibold text-bg disabled:opacity-60 hover:bg-accent-hover">
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </div>
        <p className="mt-6 text-[11px] text-ink-muted">
          Make sure your user is also inserted into <code className="text-accent">admin_users</code> in Supabase.
        </p>
      </form>
    </div>
  );
}
