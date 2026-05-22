-- After applying this migration, run: npm run supabase:types
-- to regenerate src/types/supabase.ts

create table if not exists public.slots (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  starts_at timestamptz not null,
  duration_minutes int not null check (duration_minutes > 0 and duration_minutes <= 480),
  capacity int not null check (capacity > 0 and capacity <= 100),
  reserved_count int not null default 0 check (reserved_count >= 0),
  price_mxn numeric(10,2) not null check (price_mxn >= 0),
  retail_price_mxn numeric(10,2),
  status text not null default 'live'
    check (status in ('live', 'paused', 'draft')),
  inventory_kind text not null
    check (inventory_kind in ('class', 'court', 'session', 'other')),
  title text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint slots_reserved_not_over_capacity check (reserved_count <= capacity)
);

create index if not exists slots_studio_starts_idx
  on public.slots(studio_id, starts_at);
create index if not exists slots_status_idx
  on public.slots(status);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.slots(id) on delete restrict,
  customer_user_id uuid not null references auth.users(id) on delete cascade,
  quantity int not null default 1 check (quantity > 0 and quantity <= 10),
  status text not null default 'confirmed'
    check (status in ('confirmed', 'cancelled', 'no_show', 'completed')),
  price_mxn numeric(10,2) not null check (price_mxn >= 0),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  cancelled_at timestamptz
);

create index if not exists bookings_customer_idx
  on public.bookings(customer_user_id);
create index if not exists bookings_slot_idx
  on public.bookings(slot_id);
create index if not exists bookings_created_idx
  on public.bookings(created_at);

alter table public.slots enable row level security;
alter table public.bookings enable row level security;

-- Slots: public read for live ones (so customers can browse), partner-owned write
create policy "slots_select_live_or_own"
  on public.slots for select
  using (
    status = 'live'
    or exists (
      select 1 from public.studios s
      where s.id = slots.studio_id and s.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "slots_partner_write"
  on public.slots for all
  using (
    exists (
      select 1 from public.studios s
      where s.id = slots.studio_id and s.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Bookings: customer reads own, partner reads bookings for their slots
create policy "bookings_select_own_or_partner"
  on public.bookings for select
  using (
    auth.uid() = customer_user_id
    or exists (
      select 1 from public.slots sl
      join public.studios s on s.id = sl.studio_id
      where sl.id = bookings.slot_id and s.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "bookings_insert_own"
  on public.bookings for insert
  with check (auth.uid() = customer_user_id);

create policy "bookings_update_own_or_partner"
  on public.bookings for update
  using (
    auth.uid() = customer_user_id
    or exists (
      select 1 from public.slots sl
      join public.studios s on s.id = sl.studio_id
      where sl.id = bookings.slot_id and s.owner_id = auth.uid()
    )
  );

comment on table public.slots is 'Bookable inventory per studio. Customers see live; partners see all their own.';
comment on table public.bookings is 'Customer reservations. Customer sees own; partner sees bookings against their slots.';
