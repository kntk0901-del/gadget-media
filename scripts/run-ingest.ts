/**
 * Local dev: run ingestion against your Supabase project from your machine.
 *   pnpm exec tsx scripts/run-ingest.ts
 * Requires .env.local with SUPABASE_SERVICE_ROLE_KEY.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();
import { runIngest, recomputeFeatured } from "../src/lib/ingestion/pipeline";

async function main() {
  console.log("→ running ingest…");
  const summary = await runIngest("dev");
  console.log(JSON.stringify(summary, null, 2));
  const n = await recomputeFeatured(5);
  console.log("featured:", n);
}
main().catch((e) => { console.error(e); process.exit(1); });
