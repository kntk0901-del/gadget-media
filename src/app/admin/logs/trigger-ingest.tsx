"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function TriggerIngest() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  async function run(kind: "ingest" | "recompute") {
    setMsg("Running…");
    const res = await fetch(`/api/admin/${kind}`, { method: "POST" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setMsg(`Failed: ${json?.error ?? res.statusText}`); return; }
    setMsg(`OK · ${JSON.stringify(json)}`);
    start(() => router.refresh());
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        disabled={pending}
        onClick={() => run("ingest")}
        className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-bg disabled:opacity-60"
      >Trigger ingest</button>
      <button
        disabled={pending}
        onClick={() => run("recompute")}
        className="rounded-full border border-ink-line bg-bg-soft px-4 py-1.5 text-sm disabled:opacity-60"
      >Recompute featured</button>
      {msg && <span className="text-xs text-ink-muted font-mono">{msg}</span>}
    </div>
  );
}
