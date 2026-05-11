import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { recomputeFeatured } from "@/lib/ingestion/pipeline";

export const dynamic = "force-dynamic";

export async function POST() {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const n = await recomputeFeatured(5);
  return NextResponse.json({ ok: true, featured: n });
}
