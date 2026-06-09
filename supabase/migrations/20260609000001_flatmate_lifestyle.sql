-- Lifestyle attributes powering the roommate compatibility "Match Score" feature.
-- Additive + nullable so existing listings and older client builds keep working;
-- the score simply omits any dimension a user hasn't filled in yet.

do $$ begin
  create type public.cleanliness_level as enum ('very_tidy', 'tidy', 'relaxed', 'laid_back');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.sleep_schedule as enum ('early_bird', 'flexible', 'night_owl');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.social_habits as enum ('homebody', 'balanced', 'social');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.study_habits as enum ('at_home', 'mixed', 'library');
exception when duplicate_object then null; end $$;

alter table public.flatmate_listings
  add column if not exists cleanliness    public.cleanliness_level,
  add column if not exists sleep_schedule public.sleep_schedule,
  add column if not exists social_habits  public.social_habits,
  add column if not exists study_habits   public.study_habits;
