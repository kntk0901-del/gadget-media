-- ============================================================================
-- Seed data: categories, primary tags, sources, source_rules, featured slots
-- Safe to run multiple times (on conflict do nothing).
-- ============================================================================

-- ---------- categories ----------
insert into categories (slug, name, priority, is_primary, description) values
  ('smartphones',  'Smartphones',         95, true,  'Phones, foldables, flagship hardware.'),
  ('charging',     'Charging & Power',    92, true,  'GaN chargers, power banks, charging tech.'),
  ('appliances',   'Home Appliances',     88, true,  'White goods, kitchen, vacuum, climate.'),
  ('wearables',    'Wearables',           90, true,  'Smartwatches, fitness bands, rings.'),
  ('ebikes',       'E-Bikes & Mobility',  85, true,  'E-bikes, scooters, micro-mobility hardware.'),
  ('tablets',      'Tablets',             70, false, 'iPads, Android tablets, e-readers.'),
  ('audio',        'Audio',               75, false, 'Earbuds, headphones, speakers.'),
  ('smarthome',    'Smart Home',          80, false, 'Hubs, sensors, lighting, security hardware.'),
  ('robotics',     'Robotics',            78, false, 'Home robots, robot vacuums, humanoids.'),
  ('peripherals',  'PC & Peripherals',    72, false, 'Keyboards, monitors, docks, laptops.'),
  ('accessories',  'Mobile Accessories',  60, false, 'Cases, stands, cables, magnetic gear.'),
  ('tech',         'Tech & Materials',    82, false, 'Display, sensor, battery, chip technology.')
on conflict (slug) do update set
  name=excluded.name, priority=excluded.priority, is_primary=excluded.is_primary, description=excluded.description;

-- ---------- tags (canonical kickstarter set) ----------
insert into tags (slug, name, kind) values
  ('iphone','iPhone','brand'),
  ('android','Android','topic'),
  ('foldable','Foldable','topic'),
  ('gan','GaN','tech'),
  ('usb-c','USB-C','tech'),
  ('magsafe','MagSafe','tech'),
  ('qi2','Qi2','tech'),
  ('powerbank','Power Bank','topic'),
  ('smartwatch','Smartwatch','topic'),
  ('earbuds','Earbuds','topic'),
  ('headphones','Headphones','topic'),
  ('ebike','E-Bike','topic'),
  ('robot-vacuum','Robot Vacuum','topic'),
  ('display','Display','tech'),
  ('battery','Battery','tech'),
  ('sensor','Sensor','tech'),
  ('chip','Chip','tech'),
  ('apple','Apple','brand'),
  ('samsung','Samsung','brand'),
  ('google','Google','brand'),
  ('anker','Anker','brand'),
  ('dji','DJI','brand'),
  ('xiaomi','Xiaomi','brand')
on conflict (slug) do nothing;

-- ---------- sources ----------
-- Use only RSS-friendly, broadly-known sources. Adjust weights for editorial fit.
insert into sources (slug, name, homepage_url, feed_url, feed_kind, weight, language) values
  ('the-verge',     'The Verge',     'https://www.theverge.com',        'https://www.theverge.com/rss/index.xml',                   'rss', 1.20, 'en'),
  ('engadget',      'Engadget',      'https://www.engadget.com',        'https://www.engadget.com/rss.xml',                         'rss', 1.10, 'en'),
  ('gsmarena',      'GSMArena',      'https://www.gsmarena.com',        'https://www.gsmarena.com/rss-news-reviews.php3',           'rss', 1.05, 'en'),
  ('ars-technica',  'Ars Technica',  'https://arstechnica.com',         'https://feeds.arstechnica.com/arstechnica/gadgets',        'rss', 1.10, 'en'),
  ('android-police','Android Police','https://www.androidpolice.com',   'https://www.androidpolice.com/feed/',                      'rss', 1.00, 'en'),
  ('9to5mac',       '9to5Mac',       'https://9to5mac.com',             'https://9to5mac.com/feed/',                                'rss', 1.05, 'en'),
  ('9to5google',    '9to5Google',    'https://9to5google.com',          'https://9to5google.com/feed/',                             'rss', 1.05, 'en'),
  ('liliputing',    'Liliputing',    'https://liliputing.com',          'https://liliputing.com/feed/',                             'rss', 0.95, 'en'),
  ('electrek',      'Electrek',      'https://electrek.co',             'https://electrek.co/feed/',                                'rss', 1.10, 'en'),
  ('notebookcheck', 'NotebookCheck', 'https://www.notebookcheck.net',   'https://www.notebookcheck.net/News.152.0.html?type=100',   'rss', 0.95, 'en'),
  ('dpreview',      'DPReview',      'https://www.dpreview.com',        'https://www.dpreview.com/feeds/news.xml',                  'rss', 0.95, 'en'),
  ('techcrunch-hw', 'TechCrunch HW', 'https://techcrunch.com',          'https://techcrunch.com/category/gadgets/feed/',            'rss', 0.90, 'en')
on conflict (slug) do update set
  name=excluded.name, homepage_url=excluded.homepage_url,
  feed_url=excluded.feed_url, feed_kind=excluded.feed_kind,
  language=excluded.language;

-- ---------- source_rules: routing hints ----------
insert into source_rules (source_id, rule_kind, pattern, category_slug, score_delta)
select s.id, 'category_hint', null, 'smartphones', 2.0 from sources s where s.slug in ('gsmarena','android-police','9to5mac','9to5google');

insert into source_rules (source_id, rule_kind, pattern, category_slug, score_delta)
select s.id, 'category_hint', null, 'ebikes', 4.0 from sources s where s.slug = 'electrek';

insert into source_rules (source_id, rule_kind, pattern, category_slug, score_delta)
select s.id, 'category_hint', null, 'tablets', 1.0 from sources s where s.slug = 'liliputing';

-- ---------- featured_slots: prepare 5 empty pinned slots ----------
insert into featured_slots (position, note) values
  (1, 'Top story'),
  (2, 'Pick'),
  (3, 'Pick'),
  (4, 'Pick'),
  (5, 'Pick')
on conflict (position) do nothing;
