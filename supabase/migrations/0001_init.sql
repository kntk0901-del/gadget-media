-- ============================================================================
-- Gadget Media — initial schema
-- Postgres / Supabase
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- ---------- sources ----------
create table if not exists sources (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  homepage_url  text,
  feed_url      text,
  feed_kind     text not null default 'rss',     -- rss | atom | json | api | manual
  is_enabled    boolean not null default true,
  weight        real not null default 1.0,        -- editorial weight, multiplies score
  language      text not null default 'en',
  notes         text,
  last_ingest_at timestamptz,
  created_at    timestamptz not null default now()
);

-- ---------- categories ----------
create table if not exists categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  priority    int not null default 50,           -- 0..100; higher = more important
  is_primary  boolean not null default false,    -- primary editorial bucket
  description text,
  created_at  timestamptz not null default now()
);

-- ---------- tags ----------
create table if not exists tags (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name       text not null,
  kind       text not null default 'topic',     -- topic | brand | tech
  created_at timestamptz not null default now()
);

-- ---------- articles ----------
create table if not exists articles (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  source_id       uuid references sources(id) on delete set null,
  category_id     uuid references categories(id) on delete set null,
  title           text not null,
  url             text not null,
  url_hash        text not null,                -- sha256(url normalized)
  title_norm      text not null,                -- normalized title for dedupe
  short_summary   text,                          -- <= ~280 chars, original phrasing
  editorial_note  text,                          -- our own short comment
  thumbnail_url   text,
  published_at    timestamptz,
  ingested_at     timestamptz not null default now(),
  score           real not null default 0,
  editorial_boost real not null default 0,       -- manual nudge (-50..+50)
  novelty         real not null default 1.0,
  is_featured     boolean not null default false,
  is_published    boolean not null default true,
  is_blacklisted  boolean not null default false,
  dedupe_master_id uuid references articles(id) on delete set null,
  raw_meta        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

create unique index if not exists articles_url_hash_uidx on articles(url_hash);
create index if not exists articles_published_idx on articles(published_at desc);
create index if not exists articles_score_idx on articles(score desc, published_at desc);
create index if not exists articles_cat_idx on articles(category_id, published_at desc);
create index if not exists articles_source_idx on articles(source_id, published_at desc);
create index if not exists articles_featured_idx on articles(is_featured, published_at desc) where is_featured;
create index if not exists articles_title_trgm on articles using gin (title_norm gin_trgm_ops);

-- ---------- article_tags ----------
create table if not exists article_tags (
  article_id uuid references articles(id) on delete cascade,
  tag_id     uuid references tags(id)     on delete cascade,
  primary key (article_id, tag_id)
);
create index if not exists article_tags_tag_idx on article_tags(tag_id);

-- ---------- source_rules ----------
-- Per-source category hint or topic boost
create table if not exists source_rules (
  id          uuid primary key default gen_random_uuid(),
  source_id   uuid references sources(id) on delete cascade,
  rule_kind   text not null,                   -- category_hint | boost | drop
  pattern     text,                              -- optional regex
  category_slug text,
  score_delta real not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------- featured_slots ----------
-- Manual override slots for "Today's picks"
create table if not exists featured_slots (
  id          uuid primary key default gen_random_uuid(),
  position    int  not null,                    -- 1..N
  article_id  uuid references articles(id) on delete set null,
  pinned_until timestamptz,
  note        text,
  updated_at  timestamptz not null default now(),
  unique (position)
);

-- ---------- ingest_logs ----------
create table if not exists ingest_logs (
  id            uuid primary key default gen_random_uuid(),
  started_at    timestamptz not null default now(),
  finished_at   timestamptz,
  status        text not null default 'running',   -- running | ok | partial | error
  source_count  int not null default 0,
  fetched_count int not null default 0,
  created_count int not null default 0,
  skipped_count int not null default 0,
  error_count   int not null default 0,
  trigger       text not null default 'cron',     -- cron | manual | dev
  detail        jsonb not null default '{}'::jsonb
);
create index if not exists ingest_logs_started_idx on ingest_logs(started_at desc);

-- ---------- ingest_locks ----------
-- prevent concurrent ingestion runs
create table if not exists ingest_locks (
  id           text primary key,
  acquired_at  timestamptz not null default now(),
  expires_at   timestamptz not null
);

-- ---------- admin_users ----------
-- maps Supabase auth.users to admin role
create table if not exists admin_users (
  user_id  uuid primary key references auth.users(id) on delete cascade,
  role     text not null default 'editor',         -- editor | admin
  created_at timestamptz not null default now()
);

-- ============================================================================
-- helper view: article cards
-- ============================================================================
create or replace view article_cards as
  select a.id, a.slug, a.title, a.url, a.short_summary, a.editorial_note,
         a.thumbnail_url, a.published_at, a.ingested_at, a.score,
         a.is_featured, a.is_published,
         s.id as source_id, s.slug as source_slug, s.name as source_name,
         c.id as category_id, c.slug as category_slug, c.name as category_name
    from articles a
    left join sources s on s.id = a.source_id
    left join categories c on c.id = a.category_id
   where a.is_published and not a.is_blacklisted and a.dedupe_master_id is null;

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table sources         enable row level security;
alter table categories      enable row level security;
alter table tags            enable row level security;
alter table articles        enable row level security;
alter table article_tags    enable row level security;
alter table source_rules    enable row level security;
alter table featured_slots  enable row level security;
alter table ingest_logs     enable row level security;
alter table ingest_locks    enable row level security;
alter table admin_users     enable row level security;

-- Public read for editorial data (writes only via service role).
create policy "public read sources"        on sources        for select using (true);
create policy "public read categories"     on categories     for select using (true);
create policy "public read tags"           on tags           for select using (true);
create policy "public read articles"       on articles       for select using (is_published and not is_blacklisted);
create policy "public read article_tags"   on article_tags   for select using (true);
create policy "public read featured_slots" on featured_slots for select using (true);

-- Admins (via supabase auth, mapped in admin_users) can do everything.
create policy "admin all sources"       on sources       for all using (exists (select 1 from admin_users au where au.user_id = auth.uid()));
create policy "admin all categories"    on categories    for all using (exists (select 1 from admin_users au where au.user_id = auth.uid()));
create policy "admin all tags"          on tags          for all using (exists (select 1 from admin_users au where au.user_id = auth.uid()));
create policy "admin all articles"      on articles      for all using (exists (select 1 from admin_users au where au.user_id = auth.uid()));
create policy "admin all article_tags"  on article_tags  for all using (exists (select 1 from admin_users au where au.user_id = auth.uid()));
create policy "admin all source_rules"  on source_rules  for all using (exists (select 1 from admin_users au where au.user_id = auth.uid()));
create policy "admin all featured_slots" on featured_slots for all using (exists (select 1 from admin_users au where au.user_id = auth.uid()));
create policy "admin read logs"         on ingest_logs   for select using (exists (select 1 from admin_users au where au.user_id = auth.uid()));
create policy "admin all admin_users"   on admin_users   for all using (exists (select 1 from admin_users au where au.user_id = auth.uid() and au.role = 'admin'));
