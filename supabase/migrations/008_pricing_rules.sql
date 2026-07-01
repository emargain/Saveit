-- SaveIt — migration 008: pricing_rules table.
-- One row per studio holding the partner-negotiated pricing parameters.
-- The calculate_slot_price function (migration 009) reads these to compute
-- the dynamic price for each slot live at query time.
--
-- After applying, run npm run supabase:types to regenerate src/types/supabase.ts.

create table if not exists public.pricing_rules (
  studio_id uuid primary key references public.studios(id) on delete cascade,

  -- Reference prices (partner's "normal" price)
  retail_price_default numeric(10,2) not null check (retail_price_default > 0),

  -- Brand-protection floor. Algorithm never returns below this.
  floor_price numeric(10,2) not null check (floor_price > 0),

  -- Factor horario: peak vs valley multipliers.
  -- 1.00 = no discount applied. 0.60 = 40% off. etc.
  factor_horario_peak numeric(4,3) not null default 1.000
    check (factor_horario_peak > 0 and factor_horario_peak <= 1),
  factor_horario_off_peak numeric(4,3) not null default 0.700
    check (factor_horario_off_peak > 0 and factor_horario_off_peak <= 1),

  -- Peak windows as JSONB array. Shape:
  -- [{"day": "mon", "start_hour": 7, "end_hour": 9},
  --  {"day": "mon", "start_hour": 17, "end_hour": 21}, ...]
  -- "day" is one of: mon, tue, wed, thu, fri, sat, sun
  -- "start_hour" and "end_hour" are integers 0-23 (end_hour exclusive)
  -- An empty array means the studio has no peak windows (everything is off-peak)
  peak_windows jsonb not null default '[]'::jsonb,

  -- Factor ocupación: kicks in when slot occupancy is BELOW threshold.
  -- Threshold is a fraction (0.30 = "if less than 30% booked").
  -- When triggered, multiply by factor_ocupacion_low. Otherwise 1.00 (no effect).
  factor_ocupacion_threshold numeric(4,3) not null default 0.300
    check (factor_ocupacion_threshold > 0 and factor_ocupacion_threshold < 1),
  factor_ocupacion_low numeric(4,3) not null default 0.900
    check (factor_ocupacion_low > 0 and factor_ocupacion_low <= 1),

  -- Factor anticipación: kicks in when slot is within N hours.
  -- When triggered, multiply by factor_anticipacion_lastminute. Otherwise 1.00.
  factor_anticipacion_hours_threshold int not null default 24
    check (factor_anticipacion_hours_threshold > 0),
  factor_anticipacion_lastminute numeric(4,3) not null default 0.850
    check (factor_anticipacion_lastminute > 0 and factor_anticipacion_lastminute <= 1),

  -- Partner's default discount target. Used for display copy ("around X% off")
  -- and as a sanity check during partner onboarding. Not used by the algorithm.
  default_discount_pct int not null default 40
    check (default_discount_pct >= 0 and default_discount_pct <= 100),

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.pricing_rules enable row level security;

-- Public read: customers need to query (indirectly via the function) to see prices
create policy "pricing_rules_select_public"
  on public.pricing_rules for select
  using (true);

-- Partner write: only the studio's owner or an admin can change rules
create policy "pricing_rules_write_owner_or_admin"
  on public.pricing_rules for all
  using (
    exists (
      select 1 from public.studios s
      where s.id = pricing_rules.studio_id and s.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

comment on table public.pricing_rules is
  'Per-studio pricing parameters captured during partner onboarding. Consumed by calculate_slot_price() at query time. Floor enforces brand protection ("never below this"). Peak windows stored as JSONB for flexibility.';
