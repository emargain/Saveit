-- SaveIt — migration 009: calculate_slot_price function.
-- Computes the dynamic price for a slot live at query time, applying:
--   final = max(floor, retail × factor_horario × factor_ocupacion × factor_anticipacion)
--
-- Returns a structured result so the UI can display retail (crossed out),
-- dynamic price (prominent), discount %, and the "why" (which factors applied).
--
-- After applying, run npm run supabase:types to regenerate src/types/supabase.ts.

create or replace function public.calculate_slot_price(p_slot_id uuid)
returns table (
  out_slot_id uuid,
  out_retail_price numeric,
  out_dynamic_price numeric,
  out_discount_pct int,
  out_is_peak boolean,
  out_is_low_occupancy boolean,
  out_is_last_minute boolean,
  out_reasons text[]
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slot record;
  v_rules record;
  v_studio_id uuid;
  v_day_text text;
  v_hour int;
  v_window jsonb;
  v_is_peak boolean := false;
  v_occupancy numeric;
  v_is_low_occupancy boolean := false;
  v_hours_until numeric;
  v_is_last_minute boolean := false;
  v_factor_horario numeric;
  v_factor_ocupacion numeric := 1.0;
  v_factor_anticipacion numeric := 1.0;
  v_pre_floor_price numeric;
  v_final_price numeric;
  v_reasons text[] := array[]::text[];
begin
  -- Load slot
  select id, studio_id, starts_at, capacity, reserved_count, retail_price_mxn
    into v_slot
    from public.slots
    where id = p_slot_id;

  if not found then
    raise exception 'SLOT_NOT_FOUND' using errcode = 'P0002';
  end if;

  v_studio_id := v_slot.studio_id;

  -- Load pricing rules for the studio. If none, return retail price unchanged.
  select * into v_rules from public.pricing_rules where studio_id = v_studio_id;

  if not found then
    -- No rules configured. Return the slot's stored retail_price_mxn as the dynamic price.
    return query select
      v_slot.id,
      v_slot.retail_price_mxn,
      v_slot.retail_price_mxn,
      0,
      false,
      false,
      false,
      array['no_rules_configured']::text[];
    return;
  end if;

  -- Determine day of week (short text) and hour
  -- Postgres extract(dow) returns 0=Sunday, 1=Monday, ..., 6=Saturday
  v_day_text := case extract(dow from v_slot.starts_at)
    when 0 then 'sun'
    when 1 then 'mon'
    when 2 then 'tue'
    when 3 then 'wed'
    when 4 then 'thu'
    when 5 then 'fri'
    when 6 then 'sat'
  end;
  v_hour := extract(hour from v_slot.starts_at)::int;

  -- Check if slot falls in any peak window
  for v_window in select * from jsonb_array_elements(v_rules.peak_windows)
  loop
    if v_window->>'day' = v_day_text
       and v_hour >= (v_window->>'start_hour')::int
       and v_hour < (v_window->>'end_hour')::int
    then
      v_is_peak := true;
      exit;
    end if;
  end loop;

  -- Apply factor_horario
  if v_is_peak then
    v_factor_horario := v_rules.factor_horario_peak;
    v_reasons := array_append(v_reasons, 'peak_hours');
  else
    v_factor_horario := v_rules.factor_horario_off_peak;
    v_reasons := array_append(v_reasons, 'off_peak_hours');
  end if;

  -- Compute occupancy and apply factor_ocupacion
  if v_slot.capacity > 0 then
    v_occupancy := v_slot.reserved_count::numeric / v_slot.capacity::numeric;
    if v_occupancy < v_rules.factor_ocupacion_threshold then
      v_factor_ocupacion := v_rules.factor_ocupacion_low;
      v_is_low_occupancy := true;
      v_reasons := array_append(v_reasons, 'low_occupancy');
    end if;
  end if;

  -- Compute hours-until-slot and apply factor_anticipacion
  v_hours_until := extract(epoch from (v_slot.starts_at - now())) / 3600.0;
  if v_hours_until > 0 and v_hours_until < v_rules.factor_anticipacion_hours_threshold then
    v_factor_anticipacion := v_rules.factor_anticipacion_lastminute;
    v_is_last_minute := true;
    v_reasons := array_append(v_reasons, 'last_minute');
  end if;

  -- Compute pre-floor dynamic price
  v_pre_floor_price := v_rules.retail_price_default
                     * v_factor_horario
                     * v_factor_ocupacion
                     * v_factor_anticipacion;

  -- Apply floor: never go below it
  v_final_price := greatest(v_pre_floor_price, v_rules.floor_price);
  if v_final_price = v_rules.floor_price and v_pre_floor_price < v_rules.floor_price then
    v_reasons := array_append(v_reasons, 'floor_applied');
  end if;

  -- Round to nearest peso (no centavos in MXN MVP)
  v_final_price := round(v_final_price);

  return query select
    v_slot.id,
    v_rules.retail_price_default,
    v_final_price,
    case
      when v_rules.retail_price_default > 0
      then round((1 - v_final_price / v_rules.retail_price_default) * 100)::int
      else 0
    end,
    v_is_peak,
    v_is_low_occupancy,
    v_is_last_minute,
    v_reasons;
end;
$$;

revoke all on function public.calculate_slot_price(uuid) from public;
grant execute on function public.calculate_slot_price(uuid) to authenticated, anon;

comment on function public.calculate_slot_price is
  'Computes dynamic price for a slot live. Reads pricing_rules for the slot studio, applies four factors (horario, ocupación, anticipación, floor), returns structured result. Granted to anon so unauthenticated browsing shows correct prices.';
