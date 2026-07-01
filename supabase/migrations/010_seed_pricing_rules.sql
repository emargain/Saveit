-- SaveIt — migration 010: seed pricing rules for the 8 piloto studios.
-- Values are tuned for what these CDMX studios would plausibly accept.
-- Real partners will adjust these during onboarding.
--
-- NOTE: The WHERE clause filters on the seed user owner_id. Adjust this UUID
-- if running against a different environment with a different seed owner.

insert into public.pricing_rules (
  studio_id,
  retail_price_default,
  floor_price,
  factor_horario_peak,
  factor_horario_off_peak,
  peak_windows,
  factor_ocupacion_threshold,
  factor_ocupacion_low,
  factor_anticipacion_hours_threshold,
  factor_anticipacion_lastminute,
  default_discount_pct
)
select
  s.id as studio_id,
  case s.payload->>'category'
    when 'fitness' then 250
    when 'padel' then 750
    else 250
  end as retail_price_default,
  case s.payload->>'category'
    when 'fitness' then 99
    when 'padel' then 450
    else 99
  end as floor_price,
  1.000 as factor_horario_peak,
  case s.payload->>'category'
    when 'fitness' then 0.500
    when 'padel' then 0.700
    else 0.700
  end as factor_horario_off_peak,
  case s.payload->>'category'
    when 'fitness' then
      '[
        {"day": "mon", "start_hour": 7, "end_hour": 9},
        {"day": "mon", "start_hour": 18, "end_hour": 21},
        {"day": "tue", "start_hour": 7, "end_hour": 9},
        {"day": "tue", "start_hour": 18, "end_hour": 21},
        {"day": "wed", "start_hour": 7, "end_hour": 9},
        {"day": "wed", "start_hour": 18, "end_hour": 21},
        {"day": "thu", "start_hour": 7, "end_hour": 9},
        {"day": "thu", "start_hour": 18, "end_hour": 21},
        {"day": "fri", "start_hour": 7, "end_hour": 9},
        {"day": "fri", "start_hour": 18, "end_hour": 21},
        {"day": "sat", "start_hour": 9, "end_hour": 13}
      ]'::jsonb
    when 'padel' then
      '[
        {"day": "mon", "start_hour": 18, "end_hour": 22},
        {"day": "tue", "start_hour": 18, "end_hour": 22},
        {"day": "wed", "start_hour": 18, "end_hour": 22},
        {"day": "thu", "start_hour": 18, "end_hour": 22},
        {"day": "fri", "start_hour": 18, "end_hour": 22},
        {"day": "sat", "start_hour": 8, "end_hour": 20},
        {"day": "sun", "start_hour": 8, "end_hour": 20}
      ]'::jsonb
    else '[]'::jsonb
  end as peak_windows,
  0.300 as factor_ocupacion_threshold,
  0.900 as factor_ocupacion_low,
  24 as factor_anticipacion_hours_threshold,
  0.850 as factor_anticipacion_lastminute,
  case s.payload->>'category'
    when 'fitness' then 50
    when 'padel' then 35
    else 40
  end as default_discount_pct
from public.studios s
where s.owner_id = '91dff07b-a723-4358-9f0d-d7e55cd2780f'
  and not exists (select 1 from public.pricing_rules pr where pr.studio_id = s.id);
