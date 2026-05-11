import { NextRequest, NextResponse } from "next/server";
import { recomputeFeatured } from "@/lib/ingestion/pipeline";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!process.env.CRON_SECRET || bearer !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const n = await recomputeFeatured(5);
  return NextResponse.json({ ok: true, featured: n });
}
