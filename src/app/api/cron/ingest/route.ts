import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { runIngest, recomputeFeatured } from "@/lib/ingestion/pipeline";

export const dynamic = "force-dynamic";
export const maxDuration = 180;

/**
 * Vercel Cron entry. Vercel sets Authorization: Bearer $CRON_SECRET automatically.
 * We also accept the same INGEST_TOKEN for manual curl runs.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const token = req.headers.get("x-ingest-token") || new URL(req.url).searchParams.get("token") || "";
  const ok =
    (process.env.CRON_SECRET && bearer === process.env.CRON_SECRET) ||
    (process.env.INGEST_TOKEN && token === process.env.INGEST_TOKEN);
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const summary = await runIngest("cron");
    const featuredCount = await recomputeFeatured(5);
    for (const p of ["/", "/featured", "/latest"]) revalidatePath(p);
    return NextResponse.json({ ok: true, summary, featured: featuredCount, revalidated: true });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}
