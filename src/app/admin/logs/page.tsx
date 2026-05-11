import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/primitives";
import { TriggerIngest } from "./trigger-ingest";

export const dynamic = "force-dynamic";

export default async function AdminLogs() {
  if (!(await getCurrentAdmin())) redirect("/admin/login");
  const s = createSupabaseServer();
  const { data: logs } = await s.from("ingest_logs").select("*").order("started_at", { ascending: false }).limit(40);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Badge tone="accent">LOGS</Badge>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tightish">Ingestion logs</h1>
        </div>
        <TriggerIngest />
      </div>

      <div className="rounded-xl border border-ink-line bg-bg-soft overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bg-elev text-[11px] uppercase tracking-[0.2em] text-ink-muted">
            <tr>
              <th className="px-3 py-2 text-left">Started</th>
              <th className="px-3 py-2 text-left">Finished</th>
              <th className="px-3 py-2 text-left">Trigger</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-right">Sources</th>
              <th className="px-3 py-2 text-right">Fetched</th>
              <th className="px-3 py-2 text-right">Created</th>
              <th className="px-3 py-2 text-right">Skipped</th>
              <th className="px-3 py-2 text-right">Errors</th>
            </tr>
          </thead>
          <tbody>
            {(logs ?? []).map((l: any) => (
              <tr key={l.id} className="border-t border-ink-line align-top">
                <td className="px-3 py-2 font-mono text-[12px]">{l.started_at?.replace("T"," ").slice(0,16)}</td>
                <td className="px-3 py-2 font-mono text-[12px]">{l.finished_at ? l.finished_at.replace("T"," ").slice(11,16) : "—"}</td>
                <td className="px-3 py-2">{l.trigger}</td>
                <td className="px-3 py-2">{l.status}</td>
                <td className="px-3 py-2 text-right">{l.source_count}</td>
                <td className="px-3 py-2 text-right">{l.fetched_count}</td>
                <td className="px-3 py-2 text-right">{l.created_count}</td>
                <td className="px-3 py-2 text-right">{l.skipped_count}</td>
                <td className="px-3 py-2 text-right">{l.error_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
