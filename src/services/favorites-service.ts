/**
 * Favorites service — reads and writes against public.user_favorites.
 *
 * Failures are logged via console.error; functions never throw.
 * Returns null/error result objects so callers can branch cleanly.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types/supabase";
import { getSupabaseClient } from "./supabase/client";

function getDb(): SupabaseClient<Database> | null {
  return getSupabaseClient() as SupabaseClient<Database> | null;
}

/**
 * Returns an array of studio_ids the user has favorited, ordered by
 * created_at desc. Returns [] if the client is unconfigured or the query
 * fails.
 */
export async function fetchUserFavorites(userId: string): Promise<string[]> {
  const supabase = getDb();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("user_favorites")
    .select("studio_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchUserFavorites failed:", error);
    return [];
  }
  return (data ?? []).map((row) => row.studio_id);
}

/**
 * Inserts a favorite for the user. Composite PK prevents duplicates; if the
 * row already exists (error code 23505) the intent is satisfied — returns ok.
 */
export async function addFavorite(
  userId: string,
  studioId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getDb();
  if (!supabase) return { ok: false, error: "Supabase is not configured." };

  const { error } = await supabase
    .from("user_favorites")
    .insert({ user_id: userId, studio_id: studioId });

  if (error) {
    if (error.code === "23505") return { ok: true };
    console.error("addFavorite failed:", error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/**
 * Deletes the favorite for the user. If the row didn't exist, .delete()
 * succeeds silently — no special handling needed.
 */
export async function removeFavorite(
  userId: string,
  studioId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getDb();
  if (!supabase) return { ok: false, error: "Supabase is not configured." };

  const { error } = await supabase
    .from("user_favorites")
    .delete()
    .eq("user_id", userId)
    .eq("studio_id", studioId);

  if (error) {
    console.error("removeFavorite failed:", error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
