-- SaveIt — migration 007: user_views table.
-- Stores time-series record of every partner page view. Each view is a new row
-- (no upsert) so we keep full history for analytics. RLS scopes reads to own user.
-- Cascade delete on both FKs.

create table if not exists public.user_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  studio_id uuid not null references public.studios(id) on delete cascade,
  viewed_at timestamptz default now()
);

create index if not exists user_views_user_viewed_idx
  on public.user_views(user_id, viewed_at desc);

create index if not exists user_views_user_studio_idx
  on public.user_views(user_id, studio_id);

alter table public.user_views enable row level security;

create policy "user_views_select_own"
  on public.user_views for select
  using (auth.uid() = user_id);

create policy "user_views_insert_own"
  on public.user_views for insert
  with check (auth.uid() = user_id);

comment on table public.user_views is
  'Per-user record of partner page views. Append-only time-series. Indexed by user+viewed_at for recent-views queries and user+studio for view-count aggregations.';
