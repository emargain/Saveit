-- SaveIt — migration 005a: fix ambiguous column reference in create_booking.
-- The RETURN TABLE columns in 005 shadowed underlying slots columns; Postgres
-- couldn't disambiguate `capacity` inside the return query.
-- Renames return columns with `out_` prefix and switches to explicit
-- variable assignment + RETURN NEXT instead of RETURN QUERY SELECT.
-- After applying this migration, run: npm run supabase:types

-- Drop the broken version first. Postgres won't let CREATE OR REPLACE change
-- a function's return type, so we drop and recreate.
drop function if exists public.create_booking(uuid, int);

create function public.create_booking(
  p_slot_id uuid,
  p_quantity int
)
returns table (
  out_booking_id uuid,
  out_slot_id uuid,
  out_reserved_count int,
  out_capacity int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_slot_record record;
  v_booking_id uuid;
begin
  if v_user_id is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '42501';
  end if;

  if p_quantity < 1 or p_quantity > 10 then
    raise exception 'INVALID_QUANTITY' using errcode = '22023';
  end if;

  select id, capacity, reserved_count, price_mxn, status, starts_at
    into v_slot_record
    from public.slots
    where id = p_slot_id
    for update;

  if not found then
    raise exception 'SLOT_NOT_FOUND' using errcode = 'P0002';
  end if;

  if v_slot_record.status != 'live' then
    raise exception 'SLOT_NOT_LIVE' using errcode = 'P0001';
  end if;

  if v_slot_record.starts_at <= now() then
    raise exception 'SLOT_IN_PAST' using errcode = 'P0001';
  end if;

  if v_slot_record.reserved_count + p_quantity > v_slot_record.capacity then
    raise exception 'SLOT_FULL' using errcode = 'P0001';
  end if;

  insert into public.bookings (slot_id, customer_user_id, quantity, price_mxn, status)
  values (p_slot_id, v_user_id, p_quantity, v_slot_record.price_mxn, 'confirmed')
  returning id into v_booking_id;

  update public.slots
    set reserved_count = reserved_count + p_quantity,
        updated_at = now()
    where id = p_slot_id;

  out_booking_id := v_booking_id;
  out_slot_id := p_slot_id;
  out_reserved_count := v_slot_record.reserved_count + p_quantity;
  out_capacity := v_slot_record.capacity;
  return next;
end;
$$;

revoke all on function public.create_booking(uuid, int) from public;
grant execute on function public.create_booking(uuid, int) to authenticated;

comment on function public.create_booking is
  'Atomically creates a booking and increments slots.reserved_count. Raises typed exceptions on validation failures so the client can map error codes to user-facing messages.';
