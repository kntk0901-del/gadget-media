import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { runIngest, recomputeFeatured } from "@/lib/ingestion/pipeline";

export const dynamic = "force-dynamic";
export const maxDuration = 180;

/**
 * Token-protected manual / external ingest endpoint.
 *
 * Usage:
 *   curl -X POST "$URL/api/ingest?token=$INGEST_TOKEN"
 *   curl -X POST -H "x-ingest-token: $INGEST_TOKEN" "$URL/api/ingest"
 */
export async function POST(req: NextRequest) {
  const token =
    req.headers.get("x-ingest-token") ||
    new URL(req.url).searchParams.get("token");
  if (!token || token !== process.env.INGEST_TOKEN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const summary = await runIngest("manual");
    const featuredCount = await recomputeFeatured(5);
    for (const p of ["/", "/featured", "/latest"]) revalidatePath(p);
    return NextResponse.json({ ok: true, summary, featured: featuredCount, revalidated: true });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // diagnostic only
  const token = new URL(req.url).searchParams.get("token");
  if (!token || token !== process.env.INGEST_TOKEN) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, hint: "POST to run ingestion" });
}
