-- SaveIt — initial schema (run in Supabase SQL editor or CLI).
-- Adjust RLS for your auth model; anon key is used from the mobile app.

create extension if not exists "pgcrypto";

-- App role mirrored from auth.users via trigger or client writes
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  role text not null default 'customer' check (role in ('customer', 'partner', 'admin')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Bundle JSON for MVP sync; normalize into child tables later if needed
create table if not exists public.studios (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  approval_status text not null default 'draft'
    check (approval_status in (
      'draft', 'submitted', 'under_review', 'approved', 'rejected', 'suspended'
    )),
  rejection_reason text,
  payload jsonb not null default '{}',
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists studios_owner_idx on public.studios (owner_id);
create index if not exists studios_approval_idx on public.studios (approval_status);

-- Public read: approved studios only
alter table public.profiles enable row level security;
alter table public.studios enable row level security;

create policy "profiles_select_own"
  on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own"
  on public.profiles for update using (auth.uid() = id);

create policy "studios_select_public_or_own"
  on public.studios for select
  using (
    approval_status = 'approved'
    or auth.uid() = owner_id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "studios_insert_own"
  on public.studios for insert
  with check (auth.uid() = owner_id);

create policy "studios_update_own_or_admin"
  on public.studios for update
  using (
    auth.uid() = owner_id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Storage bucket: create "studio-assets" in dashboard; policies example:
-- (storage.objects) allow authenticated upload to folder matching user id

comment on table public.studios is 'Partner studio bundle; payload mirrors StudioEntity + nested slots/bookings for MVP';
