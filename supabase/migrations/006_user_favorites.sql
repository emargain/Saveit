-- SaveIt — migration 006: user_favorites table.
-- After applying, run npm run supabase:types to regenerate src/types/supabase.ts.
--
-- Stores which studios a user has hearted. Composite PK on (user_id, studio_id)
-- prevents duplicates (a user can't favorite the same studio twice).
-- Cascade delete on both FKs: deleting the user or the studio drops their favorites.

create table if not exists public.user_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  studio_id uuid not null references public.studios(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, studio_id)
);

create index if not exists user_favorites_user_idx
  on public.user_favorites(user_id, created_at desc);

alter table public.user_favorites enable row level security;

create policy "user_favorites_select_own"
  on public.user_favorites for select
  using (auth.uid() = user_id);

create policy "user_favorites_insert_own"
  on public.user_favorites for insert
  with check (auth.uid() = user_id);

create policy "user_favorites_delete_own"
  on public.user_favorites for delete
  using (auth.uid() = user_id);

comment on table public.user_favorites is
  'Per-user favorited studios. Composite PK prevents duplicates. Replaces the @saveit_favorites global AsyncStorage blob.';
