create extension if not exists "pgcrypto";

create type public.user_type as enum ('student', 'landlord');
create type public.app_role as enum ('admin', 'moderator');
create type public.cyprus_city as enum ('Nicosia', 'Limassol', 'Larnaca', 'Paphos', 'Famagusta', 'Kyrenia');
create type public.student_type as enum ('erasmus', 'full_time');
create type public.verification_status as enum ('pending', 'approved', 'rejected');
create type public.pet_preference as enum ('love', 'okay', 'neutral', 'no');
create type public.housing_status as enum ('has_flat', 'seeking_flat');
create type public.notification_type as enum ('match', 'message', 'saved_property', 'verification', 'report', 'system');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  avatar_url text,
  bio text,
  city public.cyprus_city,
  university text,
  user_type public.user_type not null,
  is_verified_landlord boolean not null default false,
  accepted_terms_at timestamptz,
  accepted_privacy_at timestamptz,
  accepted_cookies_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.user_roles (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, role)
);

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null,
  city public.cyprus_city not null,
  address text not null,
  rent_price numeric(10,2) not null check (rent_price >= 0),
  bedrooms integer not null check (bedrooms >= 0),
  bathrooms integer not null check (bathrooms >= 0),
  available_to public.student_type not null,
  image_urls text[] not null default '{}',
  latitude numeric(9,6) not null,
  longitude numeric(9,6) not null,
  phone text,
  email text,
  has_whatsapp boolean not null default false,
  is_visible boolean not null default true,
  is_approved boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.property_reviews (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (property_id, user_id)
);

create table public.property_saves (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (property_id, user_id)
);

create table public.property_views (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  viewer_id uuid not null references public.profiles (id) on delete cascade,
  viewed_at timestamptz not null default timezone('utc', now())
);

create table public.landlord_verifications (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid not null references public.profiles (id) on delete cascade,
  id_document_url text not null,
  selfie_url text not null,
  verification_status public.verification_status not null default 'pending',
  admin_notes text,
  created_at timestamptz not null default timezone('utc', now()),
  reviewed_at timestamptz,
  unique (landlord_id)
);

create table public.flatmate_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  bio text not null,
  profile_image_url text,
  min_budget numeric(10,2) not null check (min_budget >= 0),
  max_budget numeric(10,2) not null check (max_budget >= min_budget),
  preferred_city public.cyprus_city not null,
  student_type public.student_type not null,
  pet_preference public.pet_preference not null default 'neutral',
  interests text[] not null default '{}',
  country_of_origin text not null,
  housing_status public.housing_status not null,
  apartment_images text[] not null default '{}',
  apartment_description text,
  is_approved boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id)
);

create table public.swipes (
  id uuid primary key default gen_random_uuid(),
  swiper_id uuid not null references public.profiles (id) on delete cascade,
  swiped_id uuid not null references public.profiles (id) on delete cascade,
  direction text not null check (direction in ('left', 'right')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (swiper_id, swiped_id),
  check (swiper_id <> swiped_id)
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles (id) on delete cascade,
  user_b uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  check (user_a <> user_b)
);

create unique index matches_pair_unique_idx
  on public.matches ((least(user_a, user_b)), (greatest(user_a, user_b)));

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  attachment_url text,
  read boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.user_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reported_user_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null,
  details text,
  status public.verification_status not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  reviewed_at timestamptz,
  reviewer_id uuid references public.profiles (id) on delete set null,
  check (reporter_id <> reported_user_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  sender_id uuid references public.profiles (id) on delete set null,
  type public.notification_type not null,
  title text not null,
  body text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.site_visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  path text not null,
  referrer text,
  created_at timestamptz not null default timezone('utc', now())
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

create trigger properties_set_updated_at
before update on public.properties
for each row execute procedure public.set_updated_at();

create trigger flatmate_listings_set_updated_at
before update on public.flatmate_listings
for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, user_type)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data ->> 'user_type')::public.user_type, 'student')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  );
$$;

create or replace function public.is_match_participant(_match_id uuid, _user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.matches
    where id = _match_id
      and (_user_id = user_a or _user_id = user_b)
  );
$$;

create or replace function public.is_not_blocked(_user_a uuid, _user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1
    from public.user_blocks
    where (blocker_id = _user_a and blocked_id = _user_b)
       or (blocker_id = _user_b and blocked_id = _user_a)
  );
$$;

create or replace function public.create_match_from_swipe()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.direction = 'right'
    and exists (
      select 1
      from public.swipes other
      where other.swiper_id = new.swiped_id
        and other.swiped_id = new.swiper_id
        and other.direction = 'right'
    )
  then
    insert into public.matches (user_a, user_b)
    values (least(new.swiper_id, new.swiped_id), greatest(new.swiper_id, new.swiped_id))
    on conflict do nothing;

    insert into public.notifications (recipient_id, sender_id, type, title, body)
    values
      (new.swiper_id, new.swiped_id, 'match', 'It''s a match!', 'You can now start chatting privately.'),
      (new.swiped_id, new.swiper_id, 'match', 'It''s a match!', 'You can now start chatting privately.')
    on conflict do nothing;
  end if;

  return new;
end;
$$;

create trigger swipes_create_match_trigger
after insert on public.swipes
for each row execute procedure public.create_match_from_swipe();

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.properties enable row level security;
alter table public.property_reviews enable row level security;
alter table public.property_saves enable row level security;
alter table public.property_views enable row level security;
alter table public.landlord_verifications enable row level security;
alter table public.flatmate_listings enable row level security;
alter table public.swipes enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;
alter table public.user_blocks enable row level security;
alter table public.user_reports enable row level security;
alter table public.notifications enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.site_visits enable row level security;

create policy "profiles_select_authenticated"
on public.profiles for select
to authenticated
using (true);

create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "user_roles_admin_read"
on public.user_roles for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "properties_select_visible_or_owner"
on public.properties for select
to authenticated
using (
  ((is_visible and is_approved) or owner_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
  and public.is_not_blocked(auth.uid(), owner_id)
);

create policy "properties_insert_owner_landlord"
on public.properties for insert
to authenticated
with check (
  owner_id = auth.uid()
  and exists (
    select 1 from public.profiles
    where id = auth.uid() and user_type = 'landlord'
  )
);

create policy "properties_update_owner_or_admin"
on public.properties for update
to authenticated
using (owner_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
with check (owner_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create policy "properties_delete_owner_or_admin"
on public.properties for delete
to authenticated
using (owner_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create policy "property_reviews_select_authenticated"
on public.property_reviews for select
to authenticated
using (true);

create policy "property_reviews_insert_own"
on public.property_reviews for insert
to authenticated
with check (user_id = auth.uid());

create policy "property_reviews_update_own"
on public.property_reviews for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "property_saves_own"
on public.property_saves for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "property_views_insert_authenticated"
on public.property_views for insert
to authenticated
with check (viewer_id = auth.uid());

create policy "property_views_read_owner_or_admin"
on public.property_views for select
to authenticated
using (
  public.has_role(auth.uid(), 'admin')
  or exists (
    select 1 from public.properties
    where properties.id = property_views.property_id
      and properties.owner_id = auth.uid()
  )
);

create policy "landlord_verifications_select_own_or_admin"
on public.landlord_verifications for select
to authenticated
using (landlord_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create policy "landlord_verifications_insert_own"
on public.landlord_verifications for insert
to authenticated
with check (landlord_id = auth.uid());

create policy "landlord_verifications_update_admin"
on public.landlord_verifications for update
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "flatmate_listings_select_approved_or_owner"
on public.flatmate_listings for select
to authenticated
using (
  (is_approved or user_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
  and public.is_not_blocked(auth.uid(), user_id)
);

create policy "flatmate_listings_insert_own_student"
on public.flatmate_listings for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.profiles
    where id = auth.uid() and user_type = 'student'
  )
);

create policy "flatmate_listings_update_own_or_admin"
on public.flatmate_listings for update
to authenticated
using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
with check (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create policy "swipes_own"
on public.swipes for all
to authenticated
using (swiper_id = auth.uid())
with check (swiper_id = auth.uid());

create policy "matches_participants"
on public.matches for select
to authenticated
using (public.is_match_participant(id, auth.uid()));

create policy "messages_participants_select"
on public.messages for select
to authenticated
using (public.is_match_participant(match_id, auth.uid()));

create policy "messages_participants_insert"
on public.messages for insert
to authenticated
with check (
  sender_id = auth.uid()
  and public.is_match_participant(match_id, auth.uid())
);

create policy "messages_participants_update"
on public.messages for update
to authenticated
using (public.is_match_participant(match_id, auth.uid()))
with check (public.is_match_participant(match_id, auth.uid()));

create policy "user_blocks_own"
on public.user_blocks for all
to authenticated
using (blocker_id = auth.uid())
with check (blocker_id = auth.uid());

create policy "user_reports_insert_own"
on public.user_reports for insert
to authenticated
with check (reporter_id = auth.uid());

create policy "user_reports_select_own_or_admin"
on public.user_reports for select
to authenticated
using (reporter_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create policy "user_reports_update_admin"
on public.user_reports for update
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "notifications_recipient"
on public.notifications for select
to authenticated
using (recipient_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create policy "notifications_update_recipient"
on public.notifications for update
to authenticated
using (recipient_id = auth.uid())
with check (recipient_id = auth.uid());

create policy "notifications_insert_authenticated"
on public.notifications for insert
to authenticated
with check (sender_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create policy "push_subscriptions_own"
on public.push_subscriptions for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "site_visits_insert_authenticated"
on public.site_visits for insert
to authenticated
with check (user_id = auth.uid() or user_id is null);

create policy "site_visits_admin_read"
on public.site_visits for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('property-images', 'property-images', true),
  ('flatmate-images', 'flatmate-images', true),
  ('chat-attachments', 'chat-attachments', false),
  ('verification-docs', 'verification-docs', false)
on conflict (id) do nothing;

create policy "avatars_public_read"
on storage.objects for select
to authenticated
using (bucket_id = 'avatars');

create policy "avatars_owner_write"
on storage.objects for insert
to authenticated
with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "property_images_public_read"
on storage.objects for select
to authenticated
using (bucket_id = 'property-images' or bucket_id = 'flatmate-images');

create policy "property_images_owner_write"
on storage.objects for insert
to authenticated
with check (
  bucket_id in ('property-images', 'flatmate-images')
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "chat_attachments_participant_access"
on storage.objects for select
to authenticated
using (bucket_id = 'chat-attachments');

create policy "chat_attachments_owner_write"
on storage.objects for insert
to authenticated
with check (bucket_id = 'chat-attachments' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "verification_docs_owner_or_admin_read"
on storage.objects for select
to authenticated
using (
  bucket_id = 'verification-docs'
  and (
    auth.uid()::text = (storage.foldername(name))[1]
    or public.has_role(auth.uid(), 'admin')
  )
);

create policy "verification_docs_owner_write"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'verification-docs'
  and auth.uid()::text = (storage.foldername(name))[1]
);
