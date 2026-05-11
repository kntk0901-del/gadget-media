import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { runIngest, recomputeFeatured } from "@/lib/ingestion/pipeline";

export const dynamic = "force-dynamic";
export const maxDuration = 180;

export async function POST() {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const summary = await runIngest("manual");
  const featured = await recomputeFeatured(5);
  return NextResponse.json({ ok: true, summary, featured });
}
