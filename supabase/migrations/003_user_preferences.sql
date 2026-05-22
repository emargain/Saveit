-- After applying this migration, run: npm run supabase:types
-- to regenerate src/types/supabase.ts

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  exercise_types text[] not null default '{}',
  frequency_per_week int check (frequency_per_week >= 0 and frequency_per_week <= 7),
  motivation text check (length(motivation) <= 500),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.user_preferences enable row level security;

create policy "user_preferences_select_own"
  on public.user_preferences for select
  using (auth.uid() = user_id);

create policy "user_preferences_insert_own"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

create policy "user_preferences_update_own"
  on public.user_preferences for update
  using (auth.uid() = user_id);

comment on table public.user_preferences is 'Per-user onboarding preferences; one row per user. Replaces the @saveit_onboarding_profile AsyncStorage blob.';
