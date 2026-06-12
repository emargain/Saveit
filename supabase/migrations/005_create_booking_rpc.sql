-- SaveIt — migration 005: booking RPC for race-safe inserts.
-- After applying this migration, run: npm run supabase:types
-- to regenerate src/types/supabase.ts.
--
-- Why an RPC: we need check-and-increment of slots.reserved_count to be
-- atomic. Doing it from the client as two queries (select capacity, then
-- insert + update) races on concurrent bookings. A Postgres function runs
-- the whole transaction server-side under a row lock.

create or replace function public.create_booking(
  p_slot_id uuid,
  p_quantity int
)
returns table (
  booking_id uuid,
  slot_id uuid,
  reserved_count int,
  capacity int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_slot public.slots%rowtype;
  v_booking_id uuid;
  v_new_reserved int;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '42501';
  end if;

  if p_quantity is null or p_quantity < 1 or p_quantity > 10 then
    raise exception 'INVALID_QUANTITY' using errcode = '22023';
  end if;

  select *
  into v_slot
  from public.slots
  where id = p_slot_id
  for update;

  if not found then
    raise exception 'SLOT_NOT_FOUND' using errcode = 'P0002';
  end if;

  if v_slot.status <> 'live' then
    raise exception 'SLOT_NOT_LIVE' using errcode = 'P0001';
  end if;

  if v_slot.starts_at <= now() then
    raise exception 'SLOT_IN_PAST' using errcode = 'P0001';
  end if;

  if v_slot.reserved_count + p_quantity > v_slot.capacity then
    raise exception 'SLOT_FULL' using errcode = 'P0001';
  end if;

  insert into public.bookings (
    slot_id,
    customer_user_id,
    quantity,
    price_mxn,
    status
  )
  values (
    p_slot_id,
    v_user_id,
    p_quantity,
    v_slot.price_mxn * p_quantity,
    'confirmed'
  )
  returning id into v_booking_id;

  update public.slots
  set
    reserved_count = reserved_count + p_quantity,
    updated_at = now()
  where id = p_slot_id
  returning slots.reserved_count into v_new_reserved;

  return query
  select
    v_booking_id,
    p_slot_id,
    v_new_reserved,
    v_slot.capacity;
end;
$$;

revoke all on function public.create_booking(uuid, int) from public;
grant execute on function public.create_booking(uuid, int) to authenticated;

comment on function public.create_booking(uuid, int) is
  'Atomically reserve a live slot for auth.uid(); returns booking_id and updated capacity.';
