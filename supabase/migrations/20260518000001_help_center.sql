-- ─────────────────────────────────────────────────────────────────────────────
-- Help Center: categories, articles, feedback, support messages, AI handoff
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Categories ────────────────────────────────────────────────────────────────
create table if not exists public.help_categories (
  id             uuid        primary key default gen_random_uuid(),
  slug           text        unique not null,
  name           text        not null,
  description    text,
  icon           text,
  color_token    text,
  display_order  int         not null default 100,
  is_active      boolean     not null default true,
  created_at     timestamptz not null default now()
);

alter table public.help_categories enable row level security;
create policy "anyone_select_categories" on public.help_categories
  for select using (is_active = true);
create policy "admin_all_categories" on public.help_categories
  for all using (
    auth.email() = 'martinahoto4@gmail.com'
  );

-- ── Articles ──────────────────────────────────────────────────────────────────
create table if not exists public.help_articles (
  id                          uuid        primary key default gen_random_uuid(),
  slug                        text        unique not null,
  category_id                 uuid        not null references public.help_categories on delete cascade,
  title                       text        not null,
  summary                     text,
  content                     text        not null default '',
  tags                        text[]      not null default '{}',
  related_article_ids         uuid[]      not null default '{}',
  status                      text        not null default 'draft' check (status in ('draft','published','archived')),
  display_order_in_category   int         not null default 100,
  search_vector               tsvector,
  view_count                  int         not null default 0,
  helpful_count               int         not null default 0,
  not_helpful_count           int         not null default 0,
  estimated_read_minutes      int,
  author_id                   uuid        references auth.users,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  published_at                timestamptz
);

create index if not exists help_articles_search_idx    on public.help_articles using gin (search_vector);
create index if not exists help_articles_category_idx  on public.help_articles (category_id, status, display_order_in_category);
create index if not exists help_articles_status_idx    on public.help_articles (status, published_at desc);

alter table public.help_articles enable row level security;
create policy "published_select" on public.help_articles
  for select using (status = 'published');
create policy "admin_all_articles" on public.help_articles
  for all using (
    auth.email() = 'martinahoto4@gmail.com'
  );

-- FTS trigger
create or replace function public.help_articles_search_vector_fn()
returns trigger language plpgsql as $$
begin
  new.search_vector :=
    setweight(to_tsvector('simple', coalesce(new.title,   '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(new.summary, '')), 'B') ||
    setweight(to_tsvector('simple', array_to_string(new.tags, ' ')), 'B') ||
    setweight(to_tsvector('simple', coalesce(new.content, '')), 'C');
  new.updated_at := now();
  return new;
end;
$$;

create trigger help_articles_search_update
  before insert or update of title, summary, content, tags
  on public.help_articles
  for each row execute function public.help_articles_search_vector_fn();

-- ── Article feedback ──────────────────────────────────────────────────────────
create table if not exists public.help_article_feedback (
  id          uuid        primary key default gen_random_uuid(),
  article_id  uuid        not null references public.help_articles on delete cascade,
  user_id     uuid        references auth.users,
  was_helpful boolean     not null,
  comment     text,
  created_at  timestamptz not null default now()
);

alter table public.help_article_feedback enable row level security;
create policy "user_insert_feedback" on public.help_article_feedback
  for insert with check (auth.uid() is not null);
create policy "user_select_own_feedback" on public.help_article_feedback
  for select using (user_id = auth.uid());
create policy "admin_all_feedback" on public.help_article_feedback
  for all using (
    auth.email() = 'martinahoto4@gmail.com'
  );

-- Keep helpful_count / not_helpful_count in sync
create or replace function public.sync_article_feedback_counts()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    if new.was_helpful then
      update public.help_articles set helpful_count = helpful_count + 1 where id = new.article_id;
    else
      update public.help_articles set not_helpful_count = not_helpful_count + 1 where id = new.article_id;
    end if;
  elsif TG_OP = 'DELETE' then
    if old.was_helpful then
      update public.help_articles set helpful_count = greatest(0, helpful_count - 1) where id = old.article_id;
    else
      update public.help_articles set not_helpful_count = greatest(0, not_helpful_count - 1) where id = old.article_id;
    end if;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger article_feedback_counts
  after insert or delete on public.help_article_feedback
  for each row execute function public.sync_article_feedback_counts();

-- ── Support messages ──────────────────────────────────────────────────────────
create table if not exists public.support_messages (
  id                 uuid        primary key default gen_random_uuid(),
  user_id            uuid        references auth.users,
  user_email         text,
  subject            text,
  category           text        not null default 'other'
                                 check (category in ('bug','feature_request','account','billing','other')),
  body               text        not null,
  attachment_urls    text[]      not null default '{}',
  status             text        not null default 'open'
                                 check (status in ('open','in_progress','resolved','closed','spam')),
  priority           text        not null default 'normal'
                                 check (priority in ('low','normal','high','urgent')),
  assigned_to        uuid        references auth.users,
  internal_notes     text,
  user_agent         text,
  app_version        text,
  page_url           text,
  created_at         timestamptz not null default now(),
  first_responded_at timestamptz,
  resolved_at        timestamptz
);

create index if not exists support_messages_status_idx on public.support_messages (status, created_at desc);
create index if not exists support_messages_user_idx   on public.support_messages (user_id, created_at desc);

alter table public.support_messages enable row level security;
create policy "user_select_own_tickets" on public.support_messages
  for select using (user_id = auth.uid());
create policy "user_insert_ticket" on public.support_messages
  for insert with check (true);
create policy "admin_all_tickets" on public.support_messages
  for all using (
    auth.email() = 'martinahoto4@gmail.com'
  );

-- ── Support replies ───────────────────────────────────────────────────────────
create table if not exists public.support_message_replies (
  id                    uuid        primary key default gen_random_uuid(),
  message_id            uuid        not null references public.support_messages on delete cascade,
  sender_id             uuid        not null references auth.users,
  sender_type           text        not null check (sender_type in ('user','admin')),
  body                  text        not null,
  attachment_urls       text[]      not null default '{}',
  read_by_recipient_at  timestamptz,
  created_at            timestamptz not null default now()
);

create index if not exists support_replies_message_idx on public.support_message_replies (message_id, created_at);

alter table public.support_message_replies enable row level security;
create policy "participants_select_replies" on public.support_message_replies
  for select using (
    exists (
      select 1 from public.support_messages
      where id = message_id and user_id = auth.uid()
    )
    or auth.email() = 'martinahoto4@gmail.com'
  );
create policy "participants_insert_reply" on public.support_message_replies
  for insert with check (
    sender_id = auth.uid()
    and (
      exists (
        select 1 from public.support_messages
        where id = message_id and user_id = auth.uid()
      )
      or auth.email() = 'martinahoto4@gmail.com'
    )
  );
create policy "admin_update_replies" on public.support_message_replies
  for update using (
    auth.email() = 'martinahoto4@gmail.com'
  );

-- ── AI handoff context ────────────────────────────────────────────────────────
create table if not exists public.ai_assistant_help_context (
  id                  uuid        primary key default gen_random_uuid(),
  user_id             uuid        not null references auth.users,
  query               text        not null,
  source              text        not null check (source in ('help_search','help_article','help_landing')),
  source_article_id   uuid        references public.help_articles,
  created_at          timestamptz not null default now()
);

alter table public.ai_assistant_help_context enable row level security;
create policy "user_insert_ai_context" on public.ai_assistant_help_context
  for insert with check (user_id = auth.uid());
create policy "user_select_own_ai_context" on public.ai_assistant_help_context
  for select using (user_id = auth.uid());
create policy "admin_all_ai_context" on public.ai_assistant_help_context
  for all using (
    auth.email() = 'martinahoto4@gmail.com'
  );

-- ── RPC: record article view ──────────────────────────────────────────────────
create or replace function public.record_article_view(p_article_id uuid)
returns void language sql security definer as $$
  update public.help_articles
  set view_count = view_count + 1
  where id = p_article_id and status = 'published';
$$;

-- ── RPC: search help articles ─────────────────────────────────────────────────
create or replace function public.search_help_articles(p_query text, p_limit int default 20)
returns table (
  id                     uuid,
  slug                   text,
  title                  text,
  summary                text,
  category_id            uuid,
  category_name          text,
  category_slug          text,
  estimated_read_minutes int,
  rank                   real
) language sql security definer as $$
  select
    a.id,
    a.slug,
    a.title,
    a.summary,
    a.category_id,
    c.name  as category_name,
    c.slug  as category_slug,
    a.estimated_read_minutes,
    ts_rank(a.search_vector, websearch_to_tsquery('simple', p_query)) as rank
  from public.help_articles a
  join public.help_categories c on c.id = a.category_id
  where
    a.status = 'published'
    and a.search_vector @@ websearch_to_tsquery('simple', p_query)
  order by rank desc
  limit p_limit;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Seed: 10 categories
-- ─────────────────────────────────────────────────────────────────────────────
insert into public.help_categories (slug, name, description, icon, display_order) values
  ('getting-started',    'Getting Started',         'New to Nestmate? Start here.',                        'Sparkles',    10),
  ('flatmates-property', 'Flatmates & Property',    'Finding flatmates, browsing listings, and messaging.', 'Home',        20),
  ('households-bills',   'Households & Bills',      'Creating households and splitting expenses.',          'Wallet',      30),
  ('rent',               'Rent Reminders',          'Setting up and managing rent payments.',               'Calendar',    40),
  ('documents',          'Documents',               'Uploading, organizing, and sharing documents.',        'FileText',    50),
  ('study-hub',          'Study Hub',               'Courses, notes, peers, and study groups.',            'BookOpen',    60),
  ('discover',           'Events & Opportunities',  'Finding and saving events, jobs, and internships.',   'Compass',     70),
  ('cyprus-tools',       'Cyprus Tools',            'Local tools: bills, buses, outages, garbage.',        'MapPin',      80),
  ('account-privacy',    'Account & Privacy',       'Profile settings, notifications, and data.',          'Lock',        90),
  ('troubleshooting',    'Troubleshooting',         'Common issues and how to fix them.',                  'AlertCircle', 100)
on conflict (slug) do nothing;

-- ─────────────────────────────────────────────────────────────────────────────
-- Seed: 23 draft articles (TODO placeholders)
-- ─────────────────────────────────────────────────────────────────────────────
do $$
declare
  c_gs   uuid; c_fp uuid; c_hb uuid; c_re uuid; c_do uuid;
  c_sh   uuid; c_di uuid; c_ct uuid; c_ap uuid; c_tr uuid;
begin
  select id into c_gs from public.help_categories where slug = 'getting-started';
  select id into c_fp from public.help_categories where slug = 'flatmates-property';
  select id into c_hb from public.help_categories where slug = 'households-bills';
  select id into c_re from public.help_categories where slug = 'rent';
  select id into c_do from public.help_categories where slug = 'documents';
  select id into c_sh from public.help_categories where slug = 'study-hub';
  select id into c_di from public.help_categories where slug = 'discover';
  select id into c_ct from public.help_categories where slug = 'cyprus-tools';
  select id into c_ap from public.help_categories where slug = 'account-privacy';
  select id into c_tr from public.help_categories where slug = 'troubleshooting';

  insert into public.help_articles
    (slug, category_id, title, summary, content, estimated_read_minutes, display_order_in_category, status)
  values
    -- Getting Started
    ('welcome-to-nestmate', c_gs,
     'Welcome to Nestmate',
     'What the app does and how to navigate it.',
     '> **TODO: write content**' || chr(10) || chr(10) || 'Cover: what Nestmate does, main sections (Home, Properties, Flatmates, Study Hub, Discover), how navigation works, first steps.',
     2, 10, 'draft'),

    ('setting-up-profile', c_gs,
     'Setting up your profile and location',
     'How to complete your profile and set your location for local features.',
     '> **TODO: write content**' || chr(10) || chr(10) || 'Cover: editing your name/bio/photo, setting city and area, why location matters for tools like garbage reminders.',
     2, 20, 'draft'),

    ('joining-a-household', c_gs,
     'Connecting with friends and joining a household',
     'How to find flatmates and join or create a household.',
     '> **TODO: write content**' || chr(10) || chr(10) || 'Cover: the Flatmates tab, swiping, matches, creating a household, inviting friends.',
     3, 30, 'draft'),

    -- Flatmates & Property
    ('search-for-flat', c_fp,
     'How to search for a flat',
     'Using filters, map view, and saved searches to find your ideal property.',
     '> **TODO: write content**' || chr(10) || chr(10) || 'Cover: the Properties tab, filter options (city, price, bedrooms), saving properties, map vs list view.',
     3, 10, 'draft'),

    ('message-a-landlord', c_fp,
     'How to message a landlord',
     'Starting a conversation and what to say to a landlord.',
     '> **TODO: write content**' || chr(10) || chr(10) || 'Cover: tapping the message button on a property, what info to include, response time expectations.',
     2, 20, 'draft'),

    ('verification-badges', c_fp,
     'Verification badges explained',
     'What the blue, gold, and platinum badges mean and how to get verified.',
     '> **TODO: write content**' || chr(10) || chr(10) || 'Cover: badge tiers, how landlords get verified, what it means for renters, student ID verification.',
     2, 30, 'draft'),

    -- Households & Bills
    ('create-household', c_hb,
     'Creating a household and inviting flatmates',
     'How to start a household group and add your roommates.',
     '> **TODO: write content**' || chr(10) || chr(10) || 'Cover: create from home quick action, household name, invite link, accepting invite.',
     2, 10, 'draft'),

    ('add-expense', c_hb,
     'Adding your first expense',
     'Recording a shared expense so it can be split among household members.',
     '> **TODO: write content**' || chr(10) || chr(10) || 'Cover: + button in household, entering amount, description, date, paid by whom.',
     2, 20, 'draft'),

    ('splitting-options', c_hb,
     'Splitting expenses: equally, by shares, or custom',
     'The three ways to divide an expense among your household.',
     '> **TODO: write content**' || chr(10) || chr(10) || 'Cover: equal split, percentage/shares split, custom amounts, when to use each.',
     3, 30, 'draft'),

    ('settling-up', c_hb,
     'Settling up — how the math works',
     'Understanding balances and recording payments between flatmates.',
     '> **TODO: write content**' || chr(10) || chr(10) || 'Cover: balance summary, who owes whom, recording a settlement, what happens to the balance.',
     3, 40, 'draft'),

    -- Rent
    ('rent-reminders-setup', c_re,
     'Setting up rent reminders',
     'How to log your rent agreement and get reminded before it is due.',
     '> **TODO: write content**' || chr(10) || chr(10) || 'Cover: rent section, entering monthly amount and due date, notification timing options.',
     2, 10, 'draft'),

    ('mark-rent-paid', c_re,
     'Marking rent as paid and receipts',
     'Recording a payment and keeping a history of rent receipts.',
     '> **TODO: write content**' || chr(10) || chr(10) || 'Cover: Mark paid button, payment history, exporting or sharing receipt.',
     2, 20, 'draft'),

    -- Documents
    ('upload-documents', c_do,
     'Uploading and organizing documents',
     'How to store contracts, IDs, and other important files in Nestmate.',
     '> **TODO: write content**' || chr(10) || chr(10) || 'Cover: upload button, supported file types, folder/category system, expiry date tracking.',
     2, 10, 'draft'),

    ('share-document', c_do,
     'Sharing a document securely',
     'How to send a document with a time-limited link.',
     '> **TODO: write content**' || chr(10) || chr(10) || 'Cover: share button, link expiry options, what recipients see, revoking access.',
     2, 20, 'draft'),

    -- Study Hub
    ('adding-courses', c_sh,
     'Adding your courses',
     'Setting up your course schedule in the Study Hub.',
     '> **TODO: write content**' || chr(10) || chr(10) || 'Cover: My Courses tab, adding course name/code/credits, why it matters for matching study peers.',
     2, 10, 'draft'),

    ('study-peers', c_sh,
     'Finding study peers and mentors',
     'Connecting with students who share your courses or university.',
     '> **TODO: write content**' || chr(10) || chr(10) || 'Cover: Peers tab, filter by course/university, sending connection request, messaging.',
     2, 20, 'draft'),

    -- Discover
    ('saving-events', c_di,
     'Saving events and getting reminders',
     'How to bookmark opportunities and be notified before they close.',
     '> **TODO: write content**' || chr(10) || chr(10) || 'Cover: bookmarking from the Discover feed, reminder options, managing saved items.',
     2, 10, 'draft'),

    -- Cyprus Tools
    ('bills-calculator', c_ct,
     'Understanding the bills calculator',
     'Estimating your electricity, water, and internet costs in Cyprus.',
     '> **TODO: write content**' || chr(10) || chr(10) || 'Cover: finding the calculator in local tools, entering flat size and usage, what the estimates include.',
     2, 10, 'draft'),

    ('garbage-reminders', c_ct,
     'Setting up garbage day reminders',
     'Getting notified on your municipality''s collection day.',
     '> **TODO: write content**' || chr(10) || chr(10) || 'Cover: enabling in profile, how the area is detected, what the notification says.',
     2, 20, 'draft'),

    -- Account & Privacy
    ('managing-notifications', c_ap,
     'Managing your notifications',
     'Controlling which alerts Nestmate sends you.',
     '> **TODO: write content**' || chr(10) || chr(10) || 'Cover: notification settings in profile, push vs in-app, categories you can toggle.',
     2, 10, 'draft'),

    ('data-privacy', c_ap,
     'What data Nestmate stores about you',
     'An honest look at what we collect and how to delete your account.',
     '> **TODO: write content**' || chr(10) || chr(10) || 'Cover: what is stored (profile, messages, rent data), what is NOT stored, how to export/delete.',
     3, 20, 'draft'),

    -- Troubleshooting
    ('no-notifications', c_tr,
     'I''m not receiving notifications',
     'Steps to fix missing push or in-app notifications.',
     '> **TODO: write content**' || chr(10) || chr(10) || 'Cover: check browser/OS permissions, re-enabling push in profile settings, known issues.',
     3, 10, 'draft'),

    ('forgot-password', c_tr,
     'I forgot my password / can''t log in',
     'How to reset your password and regain access to your account.',
     '> **TODO: write content**' || chr(10) || chr(10) || 'Cover: forgot password link on login screen, email link, if email not received, contacting support.',
     2, 20, 'draft')

  on conflict (slug) do nothing;
end;
$$;
