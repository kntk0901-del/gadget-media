# GADGET//WIRE — Hard-gadget curation media

A production-ready owned-media starter focused exclusively on **hard gadgets**:
smartphones, GaN chargers, power banks, home appliances, wearables, e-bikes, and adjacent hardware.

It is a **curation platform**, not a republisher:
- We aggregate RSS / official feeds
- We store only metadata + short summaries + editorial notes
- We link out to the original source

## Stack

- **Next.js 14 (App Router) + TypeScript**
- **Tailwind CSS** with a dark, editorial theme
- **Supabase** (Postgres + Auth + RLS)
- **Vercel** (hosting + Cron) — daily ingestion
- `fast-xml-parser` for RSS/Atom

## Repo layout

```
src/
├─ app/
│  ├─ (public pages)        # /, /latest, /featured, /search, /category, /tag, /article, /source
│  ├─ admin/                # /admin/* — login, dashboard, articles, sources, taxonomy, featured, logs
│  ├─ api/                  # /api/ingest, /api/cron/*, /api/admin/*
│  ├─ sitemap.ts / robots.ts
│  ├─ layout.tsx / globals.css / not-found.tsx
├─ components/              # Nav, Footer, ArticleCard, Feed, Filters, primitives
├─ lib/
│  ├─ supabase/             # server / client / admin
│  ├─ ingestion/            # rss, classify, dedupe, scoring, pipeline
│  ├─ queries.ts            # public-side data fetchers
│  ├─ utils.ts / types.ts / auth.ts
├─ middleware.ts            # /admin auth gate

supabase/
└─ migrations/              # 0001_init.sql, 0002_seed.sql

scripts/run-ingest.ts        # local one-shot ingest
tests/                       # vitest unit tests
vercel.json                  # Vercel Cron config
```

## Local setup

```bash
pnpm install      # or npm/yarn — choose your poison
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, ANON KEY, SERVICE_ROLE_KEY, INGEST_TOKEN, CRON_SECRET
pnpm dev
```

The site starts empty; populate it via the ingestion pipeline (below).

## Supabase setup

1. Create a new Supabase project.
2. In **SQL Editor**, run `supabase/migrations/0001_init.sql`.
3. Then run `supabase/migrations/0002_seed.sql`.
   - Loads canonical categories, primary tags, and a default set of RSS sources.
4. In **Auth → Users**, create your admin user.
5. In **SQL Editor**, insert that user into the admin table:
   ```sql
   insert into admin_users (user_id, role) values ('<auth.users.id>', 'admin');
   ```
6. The RLS policies in `0001_init.sql` keep public read on editorial data
   and gate writes to admins (or service-role).

## Vercel setup

1. Push the repo to GitHub.
2. Import into Vercel.
3. Add env vars from `.env.example`.
4. Deploy.
5. Vercel reads `vercel.json` and registers two cron jobs:
   - `0 21 * * *` UTC → `/api/cron/ingest`
   - `30 21 * * *` UTC → `/api/cron/recompute-featured`
   (Adjust to your timezone in `vercel.json`.)

> Vercel sends `Authorization: Bearer $CRON_SECRET` on cron calls automatically. We verify it on both cron endpoints.

## Ingestion flow

```
Vercel Cron ───► /api/cron/ingest
                     │
                     ▼
           runIngest()  in src/lib/ingestion/pipeline.ts
                     │
       ┌─────────────┼─────────────────────────────────────┐
       │             │                                     │
   acquire lock   load sources + recent candidates      log row
       │             │
       ▼             ▼
   per source:
     fetchFeed() → items
       │
       ▼
   per item:
     normalizeUrl + sha256 → urlHash
     classify(): rules → category + tags + keyword boost
     findDuplicate(): exact URL → near title → same topic
     scoreArticle(): freshness × source × category + boosts
     insert article (+ tags) (drafts duplicates for review)
       │
       ▼
   release lock, update log, recompute featured
```

Manual runs:

```bash
# from anywhere with the token:
curl -X POST -H "x-ingest-token: $INGEST_TOKEN" "$SITE_URL/api/ingest"

# from the admin UI: /admin/logs → "Trigger ingest"

# locally, against your Supabase:
pnpm run ingest:local
```

## Storage policy

We store **only**:

| Stored          | Not stored                                |
|-----------------|-------------------------------------------|
| title           | full article body                         |
| outbound URL    | full HTML / mirrored copies               |
| short summary   | copyrighted images (we use placeholders)  |
| editorial note  | long quoted content                       |
| thumbnail URL*  |                                           |
| category / tags |                                           |
| score           |                                           |

`*` We keep only the URL of the source's thumbnail; if rights look unclear, set `thumbnail_url` to `null` in the admin editor and the card will show the placeholder.

## Classification

See `src/lib/ingestion/classify.ts`.

- **Blacklist regex** drops politics, generic AI app news, crypto, celebrity, etc.
- **Hard-gadget gate** requires at least one hardware-related keyword.
- **First-match-wins** category routing; tag and keyword-boost accumulate.
- Source-level `source_rules` rows can add a fallback category and an extra
  score delta for trusted feeds.

Adding a new rule = one extra line in the `RULES` array, plus optional source rule.

## Duplicate handling

See `src/lib/ingestion/dedupe.ts`. Three layers:

1. **Exact URL** — same normalized URL → skipped entirely
2. **Near-duplicate title** — Jaccard ≥ 0.82 on normalized titles → inserted as draft, linked to master
3. **Same topic, recent** — Jaccard ≥ 0.60 within a 36h window → inserted as draft, linked to master

Drafts land at `/admin/articles?filter=pending` for editor review.

## Scoring

See `src/lib/ingestion/scoring.ts`.

```
score = freshness(publishedAt)
      * sourceWeight
      * categoryPriority / 100
      * 20
      + keywordBoost
      + editorialBoost
      + (novelty - 1) * 5
      - 8 if isDuplicate
      = -100 if isBlacklisted
```

`recomputeFeatured()` picks the top N (default 5) recent articles and flips
`is_featured = true`. Manual `featured_slots` pins always win on the home page.

## Adding a new source

1. **Easy path** — go to `/admin/sources` and add the feed URL.
2. **From SQL** — insert into `sources`, optionally a row into `source_rules`.
3. Re-run ingestion: `/admin/logs → Trigger ingest`.

## Deployment

```bash
# 1. Push repo
git push origin main

# 2. Vercel import → set env vars → deploy

# 3. After first deploy, verify cron is registered in Vercel project settings.

# 4. Run an initial ingest:
curl -X POST -H "x-ingest-token: $INGEST_TOKEN" "$SITE_URL/api/ingest"
```

## Troubleshooting

- **`ingest already running`** — `ingest_locks` row not released (e.g. previous run crashed). Run `delete from ingest_locks;`.
- **No articles appear** — confirm sources are `is_enabled = true`, and that `runIngest` log shows `fetched_count > 0`.
- **Everything classified as `is_relevant: false`** — most likely the source's feed contains non-hardware items; widen `HARD_GADGET` regex or add a `source_rules` `category_hint` for that source.
- **Admin pages flash before redirect** — make sure both `middleware.ts` and `getCurrentAdmin()` checks are present; you need a row in `admin_users`.
- **RLS errors on admin writes** — your auth user is not in `admin_users`. Insert manually.

## Future extensions

- **Editorial summarisation** — invoke an LLM via a server action to generate `editorial_note` from `short_summary` (kept short, attribution preserved).
- **Multi-language** — `sources.language` is already there; add a locale filter and translated UI.
- **Push / email digest** — a second cron `/api/cron/digest` that sends the top 10 daily picks to a list.
- **Custom feeds per topic** — derived RSS at `/feed/[category].xml`.
- **Trending detection** — combine recency × per-source hit count + cross-source mentions in last 24h.
- **Image proxying** — only if you have legal coverage; otherwise keep using the source thumbnail URL directly or fall back to the placeholder.
- **Editor roles** — `admin_users.role` already supports `editor` vs `admin`; extend policies to differentiate.

## Quality bar

- ✅ Premium dark editorial design (Tailwind, Space Grotesk + Inter)
- ✅ Mobile-first, multi-column desktop
- ✅ Curation-only (no full body storage)
- ✅ Daily automatic refresh via Vercel Cron
- ✅ Rule-based classification, dedupe, and scoring with unit tests
- ✅ Admin review queue for risky/duplicate ingest results
- ✅ Sitemap, robots, OGP, canonical URLs, noindex for admin
- ✅ Idempotent ingestion with lock + log

## License

Code: MIT. Editorial content displayed via this site is the property of the
original publishers; we only show short summaries and outbound links.
