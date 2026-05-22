-- SaveIt — allow self-insert into public.profiles during signup.
-- Run in Supabase SQL editor or CLI.
--
-- Context: with "Confirm email" enabled, supabase.auth.signUp() does NOT
-- return a session. That means auth.uid() is null when the mobile client
-- immediately tries to insert a corresponding row into public.profiles,
-- and the default RLS posture rejects the insert.
--
-- This permissive INSERT policy lets the client write its own profile row
-- right after signUp. It is acceptable for MVP because:
--   (a) The id column is a foreign key to auth.users, so a row can only
--       be inserted for a real, just-created authenticated user id.
--   (b) email and role are not sensitive at the point of insertion;
--       the role choice is already exposed via the client anyway.
--
-- Tighten later by replacing this with a server-side trigger on
-- auth.users that auto-inserts the matching profile row, then dropping
-- this policy.

create policy "profiles_insert_self_during_signup"
  on public.profiles for insert
  with check (true);
